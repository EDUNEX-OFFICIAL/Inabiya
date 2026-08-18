import { Global, Module } from '@nestjs/common';
import { MediaVariantsQueueService } from './media-variants-queue.service';

@Global()
@Module({
  providers: [MediaVariantsQueueService],
  exports: [MediaVariantsQueueService],
})
export class MediaVariantsQueueModule {}
