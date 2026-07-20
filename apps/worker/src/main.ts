import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import pino from 'pino';
import { randomUUID } from 'crypto';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { singleLine: true } }
      : undefined,
});

const QUEUE_NAME = 'sample';

interface SampleJobData {
  message: string;
  correlationId: string;
}

async function main() {
  const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6381';
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  const queue = new Queue<SampleJobData>(QUEUE_NAME, { connection });

  const worker = new Worker<SampleJobData>(
    QUEUE_NAME,
    async (job: Job<SampleJobData>) => {
      logger.info(
        {
          jobId: job.id,
          correlationId: job.data.correlationId,
          message: job.data.message,
        },
        'sample job processed',
      );
      return { ok: true };
    },
    { connection },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'sample job failed');
  });

  const correlationId = randomUUID();
  const job = await queue.add(
    'hello',
    { message: 'Phase 0 sample job', correlationId },
    { removeOnComplete: 100, removeOnFail: 100 },
  );

  logger.info(
    { jobId: job.id, correlationId, queue: QUEUE_NAME },
    'sample job enqueued — worker ready',
  );

  const shutdown = async () => {
    logger.info('shutting down worker');
    await worker.close();
    await queue.close();
    await connection.quit();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

void main().catch((err) => {
  logger.error({ err }, 'worker failed to start');
  process.exit(1);
});
