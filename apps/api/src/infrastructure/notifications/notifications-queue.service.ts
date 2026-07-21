import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';

export type OrderConfirmationJob = {
  orderId: string;
  orderNumber: string;
  userEmail: string;
  totalPaise: number;
};

export type CartAbandonmentJob = {
  cartId: string;
  userEmail: string | null;
  itemCount: number;
};

export type AssignmentDueReminderJob = {
  articleId: string;
  title: string;
  dueAt: string;
  assigneeEmail: string | null;
};

export type PasswordResetJob = {
  userId: string;
  userEmail: string;
  resetUrl: string;
  expiresAt: string;
};

type NotificationJob =
  | OrderConfirmationJob
  | CartAbandonmentJob
  | AssignmentDueReminderJob
  | PasswordResetJob;

@Injectable()
export class NotificationsQueueService {
  private queue: Queue<NotificationJob> | null = null;

  constructor(private readonly redis: RedisService) {}

  private getQueue(): Queue<NotificationJob> {
    if (!this.queue) {
      this.queue = new Queue<NotificationJob>('notifications', {
        connection: this.redis.getClient(),
      });
    }
    return this.queue;
  }

  async enqueueOrderConfirmation(data: OrderConfirmationJob): Promise<void> {
    await this.getQueue().add('order.confirmation', data, {
      removeOnComplete: 200,
      removeOnFail: 200,
    });
  }

  async enqueueCartAbandonment(data: CartAbandonmentJob): Promise<void> {
    await this.getQueue().add('cart.abandonment', data, {
      jobId: `cart-abandon-${data.cartId}`,
      removeOnComplete: 200,
      removeOnFail: 200,
    });
  }

  async enqueueAssignmentDueReminder(data: AssignmentDueReminderJob): Promise<void> {
    await this.getQueue().add('assignment.due_reminder', data, {
      jobId: `article-due-${data.articleId}`,
      removeOnComplete: 200,
      removeOnFail: 200,
    });
  }

  async enqueuePasswordReset(data: PasswordResetJob): Promise<void> {
    await this.getQueue().add('auth.password_reset', data, {
      removeOnComplete: 200,
      removeOnFail: 200,
    });
  }
}
