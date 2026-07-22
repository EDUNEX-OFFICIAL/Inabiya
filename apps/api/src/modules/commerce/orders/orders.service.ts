import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { PaymentsService } from '../../../infrastructure/payments/payments.service';
import { AuditService } from '../../audit/audit.service';
import {
  asInvoiceAddress,
  isInvoiceEligible,
  renderInvoicePdf,
  toInvoicePreviewDto,
  type InvoiceInput,
  type InvoicePreviewDto,
} from './order-invoice';

const FULFILLMENT_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID: ['PROCESSING'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
};

const CANCELABLE: OrderStatus[] = ['PAID', 'PROCESSING'];

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly payments: PaymentsService,
  ) {}

  async listForCustomer(userId: string) {
    const rows = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return rows.map((o) => this.mapSummary(o));
  }

  async getForCustomer(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        payments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    return {
      ...this.mapDetail(order),
    };
  }

  /** Invoice payload for storefront preview — ownership scoped. */
  async getInvoiceForCustomer(userId: string, orderId: string): Promise<InvoicePreviewDto> {
    const input = await this.loadInvoiceInput(userId, orderId);
    return toInvoicePreviewDto(input);
  }

  /** PDF tax receipt for paid (or refunded) orders — ownership scoped. */
  async getInvoicePdfForCustomer(
    userId: string,
    orderId: string,
  ): Promise<{
    filename: string;
    pdf: Buffer;
  }> {
    const input = await this.loadInvoiceInput(userId, orderId);
    const pdf = await renderInvoicePdf(input);
    return {
      filename: `inabiya-invoice-${input.orderNumber}.pdf`,
      pdf,
    };
  }

  private async loadInvoiceInput(userId: string, orderId: string): Promise<InvoiceInput> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        user: true,
        items: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    if (!isInvoiceEligible(order)) {
      throw new BadRequestException({
        code: 'INVOICE_UNAVAILABLE',
        message: 'Invoice is available after payment is captured.',
      });
    }
    const payment = order.payments.find(
      (p) => p.status === PaymentStatus.CAPTURED || p.status === PaymentStatus.REFUNDED,
    );
    return {
      invoiceNumber: `INV-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      issuedAt: order.paidAt ?? order.createdAt,
      paidAt: order.paidAt,
      status: order.status,
      customerEmail: order.user.email,
      customerName: order.user.displayName,
      shippingAddress: asInvoiceAddress(order.shippingAddress),
      billingAddress: asInvoiceAddress(order.billingAddress),
      items: order.items.map((i) => ({
        title: i.title,
        label: i.label,
        sku: i.sku,
        quantity: i.quantity,
        unitPricePaise: i.unitPricePaise,
        lineTotalPaise: i.lineTotalPaise,
      })),
      subtotalPaise: order.subtotalPaise,
      discountPaise: order.discountPaise,
      shippingPaise: order.shippingPaise,
      taxPaise: order.taxPaise,
      totalPaise: order.totalPaise,
      shippingMethod: order.shippingMethod,
      couponCode: order.couponCode,
      paymentProvider: payment?.provider ?? order.payments[0]?.provider ?? null,
      paymentStatus: payment?.status ?? order.payments[0]?.status ?? null,
    };
  }

  async listAdmin() {
    const rows = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: true, items: true, payments: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
    return rows.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalPaise: o.totalPaise,
      customerEmail: o.user.email,
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      paymentStatus: o.payments[0]?.status ?? 'PENDING',
      createdAt: o.createdAt,
    }));
  }

  async getAdmin(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
        payments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        notes: { orderBy: { createdAt: 'asc' }, include: { author: true } },
      },
    });
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    return {
      ...this.mapDetail(order),
      customer: {
        id: order.user.id,
        email: order.user.email,
        displayName: order.user.displayName,
        isActive: order.user.isActive,
      },
      paymentVerification: order.payments.map((p) => ({
        id: p.id,
        provider: p.provider,
        status: p.status,
        amountPaise: p.amountPaise,
        verified: p.status === 'CAPTURED',
      })),
      notes: order.notes.map((n) => ({
        id: n.id,
        body: n.body,
        authorEmail: n.author?.email ?? null,
        createdAt: n.createdAt,
      })),
      canCancel: CANCELABLE.includes(order.status),
    };
  }

  async addNote(orderId: string, body: string, authorId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    return this.prisma.orderNote.create({
      data: { orderId, authorId, body },
    });
  }

  async updateStatusAdmin(
    orderId: string,
    status: OrderStatus,
    actorId: string,
    requestId?: string,
  ) {
    if (status === OrderStatus.CANCELLED) {
      return this.cancelAndRefundAdmin(orderId, actorId, requestId);
    }
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    const allowed = FULFILLMENT_NEXT[order.status];
    if (!allowed?.includes(status)) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot move order from ${order.status} to ${status}.`,
      });
    }
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        statusHistory: {
          create: { status, note: `Admin updated to ${status}` },
        },
      },
    });
    await this.audit.write({
      actorId,
      action: 'order.status.updated',
      resource: 'order',
      resourceId: orderId,
      metadata: { status, from: order.status },
      requestId,
    });
    return updated;
  }

  /**
   * Admin cancel from PAID/PROCESSING: mock refund CAPTURED payments + restock.
   * Idempotent if already CANCELLED.
   */
  async cancelAndRefundAdmin(orderId: string, actorId: string, requestId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    if (order.status === OrderStatus.CANCELLED) {
      return this.getAdmin(orderId);
    }
    if (!CANCELABLE.includes(order.status)) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot cancel order in status ${order.status}.`,
      });
    }

    const captured = order.payments.filter((p) => p.status === PaymentStatus.CAPTURED);
    const refundIds: string[] = [];
    for (const payment of captured) {
      const claimed = await this.prisma.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.CAPTURED },
        data: { status: PaymentStatus.REFUNDED },
      });
      if (claimed.count === 0) continue;
      try {
        const result = await this.payments.refund({
          paymentId: payment.id,
          amountPaise: payment.amountPaise,
          providerPaymentId: payment.providerPaymentId,
        });
        refundIds.push(result.refundId);
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { metadata: { refundId: result.refundId } },
        });
      } catch (err) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.CAPTURED },
        });
        throw err;
      }
    }

    const cancelled = await this.prisma.order.updateMany({
      where: { id: orderId, status: { in: CANCELABLE } },
      data: { status: OrderStatus.CANCELLED },
    });
    if (cancelled.count === 0) {
      return this.getAdmin(orderId);
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.quantity <= 0) continue;
        const inv = await tx.inventoryItem.findUnique({
          where: { variantId: item.variantId },
        });
        if (!inv) continue;
        await tx.inventoryItem.update({
          where: { variantId: item.variantId },
          data: { onHand: { increment: item.quantity } },
        });
      }
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.CANCELLED,
          note: 'Admin cancel + refund',
        },
      });
    });

    await this.audit.write({
      actorId,
      action: 'order.cancelled.refunded',
      resource: 'order',
      resourceId: orderId,
      metadata: {
        from: order.status,
        refundIds,
        paymentIds: captured.map((p) => p.id),
      },
      requestId,
    });

    return this.getAdmin(orderId);
  }

  private mapSummary(order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalPaise: number;
    createdAt: Date;
    paidAt: Date | null;
    items: Array<{ quantity: number }>;
    payments: Array<{ status: string }>;
  }) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalPaise: order.totalPaise,
      itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
      paymentStatus: order.payments[0]?.status ?? 'PENDING',
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      invoiceAvailable: isInvoiceEligible({
        paidAt: order.paidAt,
        payments: order.payments,
      }),
    };
  }

  private mapDetail(order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    subtotalPaise: number;
    discountPaise: number;
    shippingPaise: number;
    taxPaise: number;
    totalPaise: number;
    couponCode: string | null;
    shippingMethod: string;
    giftMessage: string | null;
    giftWrap: boolean;
    shippingAddress: unknown;
    billingAddress: unknown;
    createdAt: Date;
    paidAt: Date | null;
    items: Array<{
      id: string;
      title: string;
      label: string;
      sku: string;
      quantity: number;
      unitPricePaise: number;
      lineTotalPaise: number;
      personalization: unknown;
    }>;
    payments: Array<{ id: string; status: string; amountPaise: number; provider: string }>;
    statusHistory: Array<{ status: OrderStatus; note: string | null; createdAt: Date }>;
  }) {
    return {
      ...this.mapSummary({
        ...order,
        items: order.items,
        payments: order.payments,
      }),
      subtotalPaise: order.subtotalPaise,
      discountPaise: order.discountPaise,
      shippingPaise: order.shippingPaise,
      taxPaise: order.taxPaise,
      couponCode: order.couponCode,
      shippingMethod: order.shippingMethod,
      giftMessage: order.giftMessage,
      giftWrap: order.giftWrap,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      items: order.items,
      payments: order.payments,
      statusHistory: order.statusHistory,
    };
  }
}
