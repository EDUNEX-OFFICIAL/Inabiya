import { Injectable, Logger } from '@nestjs/common';
import { CartStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { NotificationsQueueService } from '../../../infrastructure/notifications/notifications-queue.service';

const DEFAULT_IDLE_MINUTES = 60;

@Injectable()
export class CartAbandonmentService {
  private readonly logger = new Logger(CartAbandonmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsQueueService,
  ) {}

  /** Scan idle carts and enqueue recovery email stubs (idempotent via abandonmentNotifiedAt). */
  async scanAndEnqueue(idleMinutes = DEFAULT_IDLE_MINUTES) {
    const cutoff = new Date(Date.now() - idleMinutes * 60_000);
    const carts = await this.prisma.cart.findMany({
      where: {
        status: CartStatus.ACTIVE,
        abandonmentNotifiedAt: null,
        updatedAt: { lt: cutoff },
        items: { some: {} },
      },
      take: 50,
      include: {
        user: { select: { email: true } },
        items: { select: { id: true } },
      },
    });

    let enqueued = 0;
    for (const cart of carts) {
      await this.notifications.enqueueCartAbandonment({
        cartId: cart.id,
        userEmail: cart.user?.email ?? null,
        itemCount: cart.items.length,
      });
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { abandonmentNotifiedAt: new Date() },
      });
      enqueued += 1;
    }
    this.logger.log(`cart abandonment scan: enqueued=${enqueued}`);
    return { scanned: carts.length, enqueued, idleMinutes };
  }
}
