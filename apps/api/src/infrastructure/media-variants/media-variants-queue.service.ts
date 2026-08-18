import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';

export const MEDIA_VARIANTS_QUEUE = 'media-variants';

export type MediaVariantsJob = {
  mediaAssetId: string;
};

@Injectable()
export class MediaVariantsQueueService {
  private queue: Queue<MediaVariantsJob> | null = null;

  constructor(private readonly redis: RedisService) {}

  private getQueue(): Queue<MediaVariantsJob> {
    if (!this.queue) {
      this.queue = new Queue<MediaVariantsJob>(MEDIA_VARIANTS_QUEUE, {
        connection: this.redis.getClient(),
      });
    }
    return this.queue;
  }

  async enqueue(mediaAssetId: string): Promise<void> {
    const queue = this.getQueue();
    const jobId = `media-var-${mediaAssetId}`;
    const existing = await queue.getJob(jobId);
    if (existing) {
      const state = await existing.getState();
      if (state === 'waiting' || state === 'active' || state === 'delayed' || state === 'paused') {
        return;
      }
      await existing.remove();
    }
    await queue.add(
      'media.variants',
      { mediaAssetId },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 200,
        removeOnFail: 200,
      },
    );
  }
}
