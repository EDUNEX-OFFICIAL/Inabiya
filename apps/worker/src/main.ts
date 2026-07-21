import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { singleLine: true } }
      : undefined,
});

type OrderConfirmationJob = {
  orderId: string;
  orderNumber: string;
  userEmail: string;
  totalPaise: number;
};

type CartAbandonmentJob = {
  cartId: string;
  userEmail: string | null;
  itemCount: number;
};

async function main() {
  const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6381';
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  const notifications = new Worker(
    'notifications',
    async (job: Job) => {
      if (job.name === 'order.confirmation') {
        const data = job.data as OrderConfirmationJob;
        logger.info(
          {
            jobId: job.id,
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            userEmail: data.userEmail,
            totalPaise: data.totalPaise,
          },
          'order confirmation notification (email stub)',
        );
        return { sent: true };
      }
      if (job.name === 'cart.abandonment') {
        const data = job.data as CartAbandonmentJob;
        logger.info(
          {
            jobId: job.id,
            cartId: data.cartId,
            userEmail: data.userEmail,
            itemCount: data.itemCount,
          },
          'cart abandonment recovery email (stub)',
        );
        return { sent: true };
      }
      if (job.name === 'assignment.due_reminder') {
        const data = job.data as {
          articleId: string;
          title: string;
          dueAt: string;
          assigneeEmail: string | null;
        };
        logger.info(
          {
            jobId: job.id,
            articleId: data.articleId,
            title: data.title,
            dueAt: data.dueAt,
            assigneeEmail: data.assigneeEmail,
          },
          'assignment due reminder (email stub)',
        );
        return { sent: true };
      }
      if (job.name === 'auth.password_reset') {
        const data = job.data as {
          userId: string;
          userEmail: string;
          resetUrl: string;
          expiresAt: string;
        };
        logger.info(
          {
            jobId: job.id,
            userId: data.userId,
            userEmail: data.userEmail,
            resetUrl: data.resetUrl,
            expiresAt: data.expiresAt,
          },
          'password reset email (stub)',
        );
        return { sent: true };
      }
      return { skipped: true };
    },
    { connection },
  );

  notifications.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'notification job failed');
  });

  logger.info('worker ready — notifications queue');

  const shutdown = async () => {
    logger.info('shutting down worker');
    await notifications.close();
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
