import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MediaVariantsStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { S3StorageAdapter } from '../../infrastructure/storage/s3-storage.adapter';
import { MediaVariantsQueueService } from '../../infrastructure/media-variants/media-variants-queue.service';
import { AuditService } from '../audit/audit.service';
import { validateMediaUpload } from './media-mime';
import type { MediaVariant } from './media-url';

const VARIANT_SKIP_MIMES = new Set(['image/gif', 'image/svg+xml', 'application/pdf']);

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageAdapter,
    private readonly audit: AuditService,
    private readonly variants: MediaVariantsQueueService,
  ) {}

  /** Stable same-origin path for CMS / Soft Gift `<img src>`. */
  publicUrlFor(id: string, variant: MediaVariant = 'web'): string {
    if (variant === 'original') return `/api/v1/media/${id}/content?v=original`;
    if (variant === 'thumb') return `/api/v1/media/${id}/content?v=thumb`;
    return `/api/v1/media/${id}/content?v=web`;
  }

  private mapAsset<
    T extends {
      id: string;
      storageKey: string;
      variantsStatus?: MediaVariantsStatus;
      blurDataUrl?: string | null;
    },
  >(asset: T) {
    return {
      ...asset,
      publicUrl: this.publicUrlFor(asset.id, 'web'),
      originalUrl: this.publicUrlFor(asset.id, 'original'),
      thumbUrl: this.publicUrlFor(asset.id, 'thumb'),
    };
  }

  private async enqueueVariants(id: string): Promise<void> {
    try {
      await this.variants.enqueue(id);
    } catch {
      // Redis down must not fail the upload; worker/backfill can retry.
    }
  }

  async upload(input: { file: Express.Multer.File; actorId: string; requestId?: string }) {
    const check = validateMediaUpload(input.file.mimetype, input.file.size, input.file.buffer);
    if (!check.ok) {
      throw new BadRequestException({
        code: check.code,
        message: check.message,
      });
    }

    const ext = extensionForMime(input.file.mimetype);
    const storageKey = `media/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;

    const put = await this.storage.putObject({
      key: storageKey,
      body: input.file.buffer,
      contentType: input.file.mimetype,
    });

    const skip = VARIANT_SKIP_MIMES.has(input.file.mimetype);
    const asset = await this.prisma.mediaAsset.create({
      data: {
        storageKey: put.key,
        bucket: put.bucket,
        mimeType: input.file.mimetype,
        sizeBytes: input.file.size,
        originalName: input.file.originalname?.slice(0, 255) ?? null,
        variantsStatus: skip ? MediaVariantsStatus.SKIPPED : MediaVariantsStatus.PENDING,
      },
    });

    if (!skip) {
      await this.enqueueVariants(asset.id);
    }

    await this.audit.write({
      actorId: input.actorId,
      action: 'media.uploaded',
      resource: 'media_asset',
      resourceId: asset.id,
      metadata: {
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        storageKey: asset.storageKey,
      },
      requestId: input.requestId,
    });

    return this.mapAsset(asset);
  }

  async list(input: { cursor?: string; limit: number }) {
    const rows = await this.prisma.mediaAsset.findMany({
      take: input.limit + 1,
      ...(input.cursor
        ? {
            skip: 1,
            cursor: { id: input.cursor },
          }
        : {}),
      orderBy: { createdAt: 'desc' },
    });
    const hasMore = rows.length > input.limit;
    const slice = hasMore ? rows.slice(0, input.limit) : rows;
    const items = slice.map((asset) => this.mapAsset(asset));
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;
    return { items, nextCursor };
  }

  async getById(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Media asset not found.',
      });
    }
    return this.mapAsset(asset);
  }

  async update(
    id: string,
    body: { altText?: string | null; originalName?: string | null },
    actorId: string,
    requestId?: string,
  ) {
    const existing = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Media asset not found.',
      });
    }
    const asset = await this.prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(body.altText !== undefined ? { altText: body.altText } : {}),
        ...(body.originalName !== undefined ? { originalName: body.originalName } : {}),
      },
    });
    await this.audit.write({
      actorId,
      action: 'media.updated',
      resource: 'media_asset',
      resourceId: asset.id,
      metadata: {
        fields: Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined),
      },
      requestId,
    });
    return this.mapAsset(asset);
  }

  async getPublicContent(
    id: string,
    variant: MediaVariant = 'web',
  ): Promise<{
    buffer: Buffer;
    mimeType: string;
    originalName: string | null;
    cacheControl: string;
  }> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Media asset not found.',
      });
    }
    if (!asset.mimeType.startsWith('image/')) {
      throw new BadRequestException({
        code: 'MEDIA_NOT_PUBLIC',
        message: 'Only image assets are publicly readable.',
      });
    }

    const needsVariants =
      !VARIANT_SKIP_MIMES.has(asset.mimeType) &&
      (asset.variantsStatus === MediaVariantsStatus.PENDING ||
        asset.variantsStatus === MediaVariantsStatus.FAILED);
    if (needsVariants) {
      void this.enqueueVariants(asset.id);
    }

    const longCache = 'public, max-age=2592000, stale-while-revalidate=86400, immutable';
    const shortCache = 'public, max-age=60, stale-while-revalidate=30';

    if (
      variant === 'thumb' &&
      asset.variantsStatus === MediaVariantsStatus.READY &&
      asset.thumbStorageKey
    ) {
      const buffer = await this.storage.getObjectBuffer(asset.thumbStorageKey);
      return {
        buffer,
        mimeType: 'image/webp',
        originalName: asset.originalName,
        cacheControl: longCache,
      };
    }
    if (
      (variant === 'web' || variant === 'thumb') &&
      asset.variantsStatus === MediaVariantsStatus.READY &&
      asset.webStorageKey
    ) {
      const buffer = await this.storage.getObjectBuffer(asset.webStorageKey);
      return {
        buffer,
        mimeType: 'image/webp',
        originalName: asset.originalName,
        cacheControl: longCache,
      };
    }

    const buffer = await this.storage.getObjectBuffer(asset.storageKey);
    return {
      buffer,
      mimeType: asset.mimeType,
      originalName: asset.originalName,
      cacheControl: asset.variantsStatus === MediaVariantsStatus.READY ? longCache : shortCache,
    };
  }

  async delete(input: { id: string; actorId: string; requestId?: string }) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id: input.id } });
    if (!asset) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Media asset not found.',
      });
    }
    await this.storage.deleteObject(asset.storageKey);
    if (asset.webStorageKey) await this.storage.deleteObject(asset.webStorageKey);
    if (asset.thumbStorageKey) await this.storage.deleteObject(asset.thumbStorageKey);
    await this.prisma.mediaAsset.delete({ where: { id: asset.id } });
    await this.audit.write({
      actorId: input.actorId,
      action: 'media.deleted',
      resource: 'media_asset',
      resourceId: asset.id,
      metadata: { storageKey: asset.storageKey },
      requestId: input.requestId,
    });
    return { ok: true };
  }
}

function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'image/avif':
      return '.avif';
    case 'application/pdf':
      return '.pdf';
    default:
      return '';
  }
}
