import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

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
 * S3-compatible storage adapter stub (Phase 0).
 * Phase 1 wires real SDK + signed URL upload/read flows.
 */
@Injectable()
export class S3StorageAdapter {
  constructor(@InjectPinoLogger(S3StorageAdapter.name) private readonly logger: PinoLogger) {}

  async putObject(input: PutObjectInput): Promise<{ key: string; bucket: string }> {
    const bucket = process.env.S3_BUCKET ?? 'inabiya';
    // ponytail: stub only → Phase 1 AWS SDK / MinIO client
    this.logger.info(
      { key: input.key, bucket, contentType: input.contentType, bytes: input.body.byteLength },
      'S3 putObject stub (no network call)',
    );
    return { key: input.key, bucket };
  }

  async getSignedUrl(input: SignedUrlInput): Promise<string> {
    const endpoint = process.env.S3_ENDPOINT ?? 'http://127.0.0.1:9002';
    const bucket = process.env.S3_BUCKET ?? 'inabiya';
    const expires = input.expiresInSeconds ?? 3600;
    // Stub URL — not cryptographically signed yet
    return `${endpoint}/${bucket}/${input.key}?stub=1&expires=${expires}`;
  }

  async deleteObject(key: string): Promise<void> {
    this.logger.info({ key }, 'S3 deleteObject stub (no network call)');
  }
}
