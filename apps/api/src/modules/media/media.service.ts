import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { S3StorageAdapter } from '../../infrastructure/storage/s3-storage.adapter';
import { AuditService } from '../audit/audit.service';
import { validateMediaUpload } from './media-mime';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageAdapter,
    private readonly audit: AuditService,
  ) {}

  /** Stable same-origin path for CMS / Soft Gift `<img src>`. */
  publicUrlFor(id: string): string {
    return `/api/v1/media/${id}/content`;
  }

  private mapAsset<T extends { id: string; storageKey: string }>(
    asset: T,
    signedUrl?: string,
  ) {
    return {
      ...asset,
      publicUrl: this.publicUrlFor(asset.id),
      ...(signedUrl ? { signedUrl } : {}),
    };
  }

  async upload(input: {
    file: Express.Multer.File;
    actorId: string;
    requestId?: string;
  }) {
    const check = validateMediaUpload(input.file.mimetype, input.file.size);
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

    const asset = await this.prisma.mediaAsset.create({
      data: {
        storageKey: put.key,
        bucket: put.bucket,
        mimeType: input.file.mimetype,
        sizeBytes: input.file.size,
        originalName: input.file.originalname?.slice(0, 255) ?? null,
      },
    });

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

    const signedUrl = await this.storage.getSignedUrl({ key: asset.storageKey });
    return this.mapAsset(asset, signedUrl);
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
    const items = await Promise.all(
      slice.map(async (asset) => {
        const signedUrl = await this.storage.getSignedUrl({ key: asset.storageKey });
        return this.mapAsset(asset, signedUrl);
      }),
    );
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
    const signedUrl = await this.storage.getSignedUrl({ key: asset.storageKey });
    return this.mapAsset(asset, signedUrl);
  }

  async getPublicContent(id: string): Promise<{
    buffer: Buffer;
    mimeType: string;
    originalName: string | null;
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
    const buffer = await this.storage.getObjectBuffer(asset.storageKey);
    return { buffer, mimeType: asset.mimeType, originalName: asset.originalName };
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
    case 'application/pdf':
      return '.pdf';
    default:
      return '';
  }
}
