import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { NotificationsQueueService } from '../../../infrastructure/notifications/notifications-queue.service';
import { InventoryService } from '../inventory/inventory.service';
import { CouponService } from '../promotions/coupon.service';

/** Pending payment older than this is auto-failed (release stock + restore cart). */
const PENDING_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class PaymentFulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly coupons: CouponService,
    private readonly notifications: NotificationsQueueService,
  ) {}

  async processWebhook(input: {
    provider: string;
    eventId: string;
    paymentId: string;
    status: 'CAPTURED' | 'FAILED';
    payload?: unknown;
  }): Promise<{ duplicate: boolean; orderId: string }> {
    const existing = await this.prisma.paymentWebhookEvent.findUnique({
      where: {
        provider_eventId: { provider: input.provider, eventId: input.eventId },
      },
    });
    if (existing?.processedAt) {
      const payment = await this.prisma.payment.findUnique({
        where: { id: input.paymentId },
      });
      if (!payment) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Payment not found.' });
      }
      return { duplicate: true, orderId: payment.orderId };
    }

    await this.prisma.paymentWebhookEvent.upsert({
      where: {
        provider_eventId: { provider: input.provider, eventId: input.eventId },
      },
      create: {
        provider: input.provider,
        eventId: input.eventId,
        payload: (input.payload ?? {}) as object,
      },
      update: {},
    });

    const orderId = await this.applyPaymentStatus(input.paymentId, input.status);

    await this.prisma.paymentWebhookEvent.update({
      where: {
        provider_eventId: { provider: input.provider, eventId: input.eventId },
      },
      data: { processedAt: new Date() },
    });

    return { duplicate: false, orderId };
  }

  async applyPaymentStatus(paymentId: string, status: 'CAPTURED' | 'FAILED'): Promise<string> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            items: true,
            user: true,
          },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Payment not found.' });
    }
    if (payment.status === PaymentStatus.CAPTURED) {
      return payment.orderId;
    }
    if (payment.status === PaymentStatus.FAILED && status === 'FAILED') {
      return payment.orderId;
    }
    if (payment.status === PaymentStatus.REFUNDED) {
      return payment.orderId;
    }

    const lineItems = payment.order.items.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
    }));

    if (status === 'CAPTURED') {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: PaymentStatus.CAPTURED },
        });
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.PAID, paidAt: new Date() },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            status: OrderStatus.PAID,
            note: 'Payment captured',
          },
        });
      });
      await this.inventory.commit(lineItems);
      if (payment.order.couponCode) {
        await this.coupons.incrementUsage(payment.order.couponCode);
      }
      await this.notifications.enqueueOrderConfirmation({
        orderId: payment.orderId,
        orderNumber: payment.order.orderNumber,
        userEmail: payment.order.user.email,
        totalPaise: payment.order.totalPaise,
      });
      return payment.orderId;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.FAILED },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.PAYMENT_FAILED },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.PAYMENT_FAILED,
          note: 'Payment failed',
        },
      });
    });
    await this.inventory.release(lineItems);
    await this.restoreCartFromFailedOrder(payment.orderId);
    return payment.orderId;
  }

  async confirmMockPayment(
    paymentId: string,
    userId: string,
  ): Promise<{ orderId: string; orderNumber: string }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
    if (!payment) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Payment not found.' });
    }
    if (payment.order.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Payment does not belong to this user.',
      });
    }
    const provider = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
    if (provider !== 'mock') {
      throw new BadRequestException({
        code: 'INVALID_PROVIDER',
        message: 'Mock confirm only for mock payments.',
      });
    }
    const eventId = `mock-confirm-${paymentId}`;
    await this.processWebhook({
      provider: 'mock',
      eventId,
      paymentId,
      status: 'CAPTURED',
      payload: { source: 'mock_confirm', userId },
    });
    return { orderId: payment.orderId, orderNumber: payment.order.orderNumber };
  }

  /**
   * Fail stale PENDING_PAYMENT orders so reserved stock is released and cart can be restored.
   */
  async expireStalePendingPayments(): Promise<{ expired: number }> {
    const cutoff = new Date(Date.now() - PENDING_TTL_MS);
    const stale = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: { lt: cutoff },
        order: { status: OrderStatus.PENDING_PAYMENT },
      },
      take: 50,
    });
    let expired = 0;
    for (const p of stale) {
      const eventId = `expire-${p.id}`;
      await this.processWebhook({
        provider: 'mock',
        eventId,
        paymentId: p.id,
        status: 'FAILED',
        payload: { source: 'pending_ttl_expire' },
      });
      expired += 1;
    }
    return { expired };
  }

  /** After convert-before-pay failure: recreate ACTIVE cart with order lines. */
  private async restoreCartFromFailedOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.items.length === 0) return;

    const existing = await this.prisma.cart.findFirst({
      where: { userId: order.userId, status: CartStatus.ACTIVE },
      include: { items: true },
    });
    if (existing && existing.items.length > 0) return;

    const cart =
      existing ??
      (await this.prisma.cart.create({
        data: {
          userId: order.userId,
          couponCode: order.couponCode,
          status: CartStatus.ACTIVE,
        },
      }));

    for (const item of order.items) {
      await this.prisma.cartItem.upsert({
        where: {
          cartId_variantId: { cartId: cart.id, variantId: item.variantId },
        },
        create: {
          cartId: cart.id,
          variantId: item.variantId,
          quantity: item.quantity,
          personalization: item.personalization ?? undefined,
        },
        update: { quantity: item.quantity },
      });
    }
    if (order.couponCode) {
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { couponCode: order.couponCode },
      });
    }
  }
}
