import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { mkdir, writeFile, readFile, unlink } from 'fs/promises';
import { dirname, join } from 'path';

export interface PutObjectInput {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}

export interface SignedUrlInput {
  key: string;
  expiresInSeconds?: number;
}

/**
 * Local-disk media store with stub-style signed URLs.
 * Real AWS/MinIO SDK remains deferred; bytes persist under MEDIA_LOCAL_ROOT.
 */
@Injectable()
export class S3StorageAdapter {
  constructor(@InjectPinoLogger(S3StorageAdapter.name) private readonly logger: PinoLogger) {}

  private rootDir(): string {
    return process.env.MEDIA_LOCAL_ROOT?.trim() || join(process.cwd(), '.data', 'media');
  }

  private absolutePath(key: string): string {
    const safe = key.replace(/\.\./g, '').replace(/^\/+/, '');
    return join(this.rootDir(), safe);
  }

  async putObject(input: PutObjectInput): Promise<{ key: string; bucket: string }> {
    const bucket = process.env.S3_BUCKET ?? 'inabiya';
    const abs = this.absolutePath(input.key);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, Buffer.from(input.body));
    this.logger.info(
      { key: input.key, bucket, contentType: input.contentType, bytes: input.body.byteLength, abs },
      'media putObject (local disk)',
    );
    return { key: input.key, bucket };
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const abs = this.absolutePath(key);
    try {
      return await readFile(abs);
    } catch {
      throw new NotFoundException({
        code: 'MEDIA_OBJECT_MISSING',
        message: 'Media object bytes not found on disk.',
      });
    }
  }

  async getSignedUrl(input: SignedUrlInput): Promise<string> {
    const endpoint = process.env.S3_ENDPOINT ?? 'http://127.0.0.1:9002';
    const bucket = process.env.S3_BUCKET ?? 'inabiya';
    const expires = input.expiresInSeconds ?? 3600;
    // Legacy stub URL for admin list display — prefer publicUrl from MediaService
    return `${endpoint}/${bucket}/${input.key}?stub=1&expires=${expires}`;
  }

  async deleteObject(key: string): Promise<void> {
    const abs = this.absolutePath(key);
    try {
      await unlink(abs);
    } catch {
      // idempotent delete
    }
    this.logger.info({ key }, 'media deleteObject (local disk)');
  }
}
