import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import pino from 'pino';
import { sendConsoleMail } from './console-mail';

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
        await sendConsoleMail(logger, {
          to: data.userEmail,
          subject: `Order ${data.orderNumber} confirmed`,
          text: `Your order ${data.orderNumber} (${data.totalPaise} paise) is confirmed.`,
          template: 'order.confirmation',
          meta: { jobId: job.id, orderId: data.orderId, orderNumber: data.orderNumber },
        });
        return { sent: true };
      }
      if (job.name === 'cart.abandonment') {
        const data = job.data as CartAbandonmentJob;
        await sendConsoleMail(logger, {
          to: data.userEmail ?? 'unknown@stub.local',
          subject: 'You left items in your cart',
          text: `Cart ${data.cartId} still has ${data.itemCount} item(s).`,
          template: 'cart.abandonment',
          meta: { jobId: job.id, cartId: data.cartId, itemCount: data.itemCount },
        });
        return { sent: true };
      }
      if (job.name === 'assignment.due_reminder') {
        const data = job.data as {
          articleId: string;
          title: string;
          dueAt: string;
          assigneeEmail: string | null;
        };
        await sendConsoleMail(logger, {
          to: data.assigneeEmail ?? 'unknown@stub.local',
          subject: `Assignment due: ${data.title}`,
          text: `Article "${data.title}" is due at ${data.dueAt}.`,
          template: 'assignment.due_reminder',
          meta: { jobId: job.id, articleId: data.articleId, dueAt: data.dueAt },
        });
        return { sent: true };
      }
      if (job.name === 'auth.password_reset') {
        const data = job.data as {
          userId: string;
          userEmail: string;
          resetUrl: string;
          expiresAt: string;
        };
        await sendConsoleMail(logger, {
          to: data.userEmail,
          subject: 'Reset your Inabiya password',
          text: `Use this link to reset your password (expires ${data.expiresAt}): ${data.resetUrl}`,
          template: 'auth.password_reset',
          meta: { jobId: job.id, userId: data.userId, expiresAt: data.expiresAt },
        });
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
  logger.error(err, 'worker failed to start');
  process.exit(1);
});
