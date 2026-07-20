import { Global, Module } from '@nestjs/common';
import { S3StorageAdapter } from './s3-storage.adapter';

@Global()
@Module({
  providers: [S3StorageAdapter],
  exports: [S3StorageAdapter],
})
export class StorageModule {}
