import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
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
import {
  adminOrderKeysetAfter,
  decodeAdminOrderCursor,
  encodeAdminOrderCursor,
} from './admin-orders-cursor';

const FULFILLMENT_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID: ['PROCESSING'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
};

const CANCELABLE: OrderStatus[] = ['PAID', 'PROCESSING'];

function ageHours(from: Date, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - from.getTime()) / 3_600_000));
}

function addressRisk(addr: unknown): boolean {
  if (!addr || typeof addr !== 'object') return true;
  const a = addr as Record<string, unknown>;
  const line1 = String(a.line1 ?? a.addressLine1 ?? '').trim();
  const city = String(a.city ?? '').trim();
  const phone = String(a.phone ?? a.mobile ?? '').trim();
  const pincode = String(a.pincode ?? a.postalCode ?? a.zip ?? '').trim();
  return !line1 || !city || !phone || !pincode;
}

export type AdminOrdersListQuery = {
  status?: string;
  q?: string;
  days?: number;
  payment?: 'FAILED' | 'CAPTURED' | 'PENDING' | 'REFUNDED';
  cursor?: string;
  limit?: number;
};

export type AdminStatusUpdate = {
  status: OrderStatus;
  carrier?: string;
  trackingNumber?: string;
  note?: string;
};

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
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    media: {
                      where: { kind: 'IMAGE' },
                      orderBy: { sortOrder: 'asc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
        payments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    const detail = this.mapDetail(order);
    return {
      ...detail,
      items: order.items.map((item) => ({
        id: item.id,
        title: item.title,
        label: item.label,
        sku: item.sku,
        quantity: item.quantity,
        unitPricePaise: item.unitPricePaise,
        lineTotalPaise: item.lineTotalPaise,
        personalization: item.personalization,
        giftExtras: item.giftExtras,
        extrasPaise: item.extrasPaise,
        imageUrl: item.variant.product.media[0]?.url ?? null,
      })),
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
        invoice: true,
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

    if (order.invoice) {
      return deserializeInvoiceSnapshot(order.invoice.snapshot, order.invoice.invoiceNumber);
    }

    const payment = order.payments.find(
      (p) => p.status === PaymentStatus.CAPTURED || p.status === PaymentStatus.REFUNDED,
    );
    const input: InvoiceInput = {
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

    // Idempotent create — concurrent first reads may race; unique orderId wins.
    try {
      await this.prisma.commerceInvoice.create({
        data: {
          orderId: order.id,
          invoiceNumber: input.invoiceNumber,
          issuedAt: input.issuedAt,
          snapshot: serializeInvoiceSnapshot(input),
        },
      });
    } catch {
      const existing = await this.prisma.commerceInvoice.findUnique({
        where: { orderId: order.id },
      });
      if (existing) {
        return deserializeInvoiceSnapshot(existing.snapshot, existing.invoiceNumber);
      }
    }

    return input;
  }

  async listAdmin(query: AdminOrdersListQuery = {}) {
    const limit = query.limit ?? 25;
    const andParts: Prisma.OrderWhereInput[] = [];

    if (query.status) {
      const statuses = query.status
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean) as OrderStatus[];
      const valid = statuses.filter((s) => Object.values(OrderStatus).includes(s));
      if (valid.length === 1) andParts.push({ status: valid[0] });
      else if (valid.length > 1) andParts.push({ status: { in: valid } });
    }

    if (query.days && Number.isFinite(query.days)) {
      const since = new Date();
      since.setDate(since.getDate() - query.days);
      since.setHours(0, 0, 0, 0);
      andParts.push({ createdAt: { gte: since } });
    }

    if (query.q?.trim()) {
      const term = query.q.trim();
      andParts.push({
        OR: [
          { orderNumber: { contains: term, mode: 'insensitive' } },
          { user: { email: { contains: term, mode: 'insensitive' } } },
          { trackingNumber: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    if (query.payment) {
      andParts.push({ payments: { some: { status: query.payment as PaymentStatus } } });
    }

    if (query.cursor) {
      try {
        andParts.push(
          adminOrderKeysetAfter(decodeAdminOrderCursor(query.cursor)) as Prisma.OrderWhereInput,
        );
      } catch {
        throw new BadRequestException({
          code: 'INVALID_CURSOR',
          message: 'Invalid pagination cursor.',
        });
      }
    }

    const where: Prisma.OrderWhereInput = andParts.length > 0 ? { AND: andParts } : {};

    const rows = await this.prisma.order.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalPaise: true,
        carrier: true,
        trackingNumber: true,
        createdAt: true,
        paidAt: true,
        shippingAddress: true,
        user: { select: { email: true, displayName: true } },
        items: { select: { quantity: true } },
        payments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { status: true },
        },
        returnRequests: {
          where: { status: { in: ['REQUESTED', 'APPROVED'] } },
          select: { id: true },
        },
      },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const now = new Date();
    const items = page.map((o) => {
      const paymentStatus = o.payments[0]?.status ?? 'PENDING';
      const exceptions: string[] = [];
      if (paymentStatus === 'FAILED' || o.status === 'PAYMENT_FAILED') {
        exceptions.push('payment_issue');
      }
      if (addressRisk(o.shippingAddress)) exceptions.push('address_risk');
      if (o.returnRequests.length > 0) exceptions.push('open_return');
      if (
        (o.status === 'PAID' || o.status === 'PROCESSING') &&
        ageHours(o.paidAt ?? o.createdAt, now) >= 24
      ) {
        exceptions.push('sla_aging');
      }

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalPaise: o.totalPaise,
        customerEmail: o.user.email,
        customerName: o.user.displayName,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        paymentStatus,
        carrier: o.carrier,
        trackingNumber: o.trackingNumber,
        createdAt: o.createdAt,
        paidAt: o.paidAt,
        ageHours: ageHours(o.paidAt ?? o.createdAt, now),
        exceptions,
        openReturnCount: o.returnRequests.length,
      };
    });

    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last ? encodeAdminOrderCursor({ createdAt: last.createdAt, id: last.id }) : null;

    return { items, nextCursor, limit };
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
        returnRequests: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, reason: true, createdAt: true },
        },
      },
    });
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }

    const paymentIssue =
      order.payments.some((p) => p.status === 'FAILED') || order.status === 'PAYMENT_FAILED';
    const addrRisk = addressRisk(order.shippingAddress);
    const openReturns = order.returnRequests.filter(
      (r) => r.status === 'REQUESTED' || r.status === 'APPROVED',
    );
    const exceptions: string[] = [];
    if (paymentIssue) exceptions.push('payment_issue');
    if (addrRisk) exceptions.push('address_risk');
    if (openReturns.length > 0) exceptions.push('open_return');
    if (
      (order.status === 'PAID' || order.status === 'PROCESSING') &&
      ageHours(order.paidAt ?? order.createdAt) >= 24
    ) {
      exceptions.push('sla_aging');
    }

    const next = [...(FULFILLMENT_NEXT[order.status] ?? [])];
    if (CANCELABLE.includes(order.status)) next.push(OrderStatus.CANCELLED);

    return {
      ...this.mapDetail(order),
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      shippedAt: order.shippedAt,
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
      returns: order.returnRequests,
      openReturnCount: openReturns.length,
      exceptions,
      allowedNextStatuses: next,
      canCancel: CANCELABLE.includes(order.status),
      canFulfill:
        !paymentIssue && order.status !== 'PAYMENT_FAILED' && order.status !== 'PENDING_PAYMENT',
      ageHours: ageHours(order.paidAt ?? order.createdAt),
      addressRisk: addrRisk,
    };
  }

  async addNote(orderId: string, body: string, authorId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    const note = await this.prisma.orderNote.create({
      data: { orderId, authorId, body },
    });
    await this.audit.write({
      actorId: authorId,
      action: 'order.addNote',
      resource: 'order',
      resourceId: orderId,
    });
    return note;
  }

  async updateStatusAdmin(
    orderId: string,
    body: AdminStatusUpdate,
    actorId: string,
    requestId?: string,
  ) {
    const { status } = body;
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

    if (status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED) {
      const payFail =
        order.status === OrderStatus.PAYMENT_FAILED || order.status === OrderStatus.PENDING_PAYMENT;
      if (payFail) {
        throw new BadRequestException({
          code: 'PAYMENT_BLOCKED',
          message: 'Cannot fulfill an order with unresolved payment.',
        });
      }
    }

    const historyNote =
      body.note?.trim() ||
      (status === OrderStatus.SHIPPED && body.trackingNumber
        ? `Shipped via ${body.carrier ?? 'carrier'} · ${body.trackingNumber}`
        : `Admin updated to ${status}`);

    const data: Prisma.OrderUpdateInput = {
      status,
      statusHistory: {
        create: { status, note: historyNote },
      },
    };

    if (status === OrderStatus.SHIPPED) {
      data.shippedAt = new Date();
      if (body.carrier?.trim()) data.carrier = body.carrier.trim();
      if (body.trackingNumber?.trim()) data.trackingNumber = body.trackingNumber.trim();
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data,
    });
    await this.audit.write({
      actorId,
      action: 'order.status.updated',
      resource: 'order',
      resourceId: orderId,
      metadata: {
        status,
        from: order.status,
        carrier: body.carrier ?? null,
        trackingNumber: body.trackingNumber ?? null,
      },
      requestId,
    });
    return this.getAdmin(orderId);
  }

  async bulkUpdateStatusAdmin(
    body: {
      ids: string[];
      status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
      carrier?: string;
      trackingNumber?: string;
      note?: string;
    },
    actorId: string,
    requestId?: string,
  ) {
    const results: Array<{ id: string; ok: boolean; error?: string }> = [];
    for (const id of body.ids) {
      try {
        await this.updateStatusAdmin(
          id,
          {
            status: body.status,
            carrier: body.carrier,
            trackingNumber: body.trackingNumber,
            note: body.note,
          },
          actorId,
          requestId,
        );
        results.push({ id, ok: true });
      } catch (e) {
        results.push({
          id,
          ok: false,
          error: e instanceof Error ? e.message : 'failed',
        });
      }
    }
    await this.audit.write({
      actorId,
      action: 'order.bulk.status',
      resource: 'order',
      metadata: { status: body.status, ids: body.ids, results },
      requestId,
    });
    return { status: body.status, results };
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
      giftExtras?: unknown;
      extrasPaise?: number;
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

function serializeInvoiceSnapshot(input: InvoiceInput): Prisma.InputJsonValue {
  return {
    ...input,
    issuedAt: input.issuedAt.toISOString(),
    paidAt: input.paidAt?.toISOString() ?? null,
  };
}

function deserializeInvoiceSnapshot(raw: unknown, fallbackNumber: string): InvoiceInput {
  if (!raw || typeof raw !== 'object') {
    throw new BadRequestException({
      code: 'INVOICE_CORRUPT',
      message: 'Stored invoice snapshot is invalid.',
    });
  }
  const o = raw as Record<string, unknown>;
  const issuedAt = typeof o.issuedAt === 'string' ? new Date(o.issuedAt) : new Date();
  const paidAt =
    typeof o.paidAt === 'string' ? new Date(o.paidAt) : o.paidAt === null ? null : null;
  return {
    invoiceNumber: typeof o.invoiceNumber === 'string' ? o.invoiceNumber : fallbackNumber,
    orderNumber: String(o.orderNumber ?? ''),
    issuedAt,
    paidAt,
    status: String(o.status ?? ''),
    customerEmail: String(o.customerEmail ?? ''),
    customerName: typeof o.customerName === 'string' ? o.customerName : null,
    shippingAddress: asInvoiceAddress(o.shippingAddress),
    billingAddress: asInvoiceAddress(o.billingAddress),
    items: Array.isArray(o.items)
      ? (o.items as InvoiceInput['items']).map((i) => ({
          title: String(i.title ?? ''),
          label: String(i.label ?? ''),
          sku: String(i.sku ?? ''),
          quantity: Number(i.quantity) || 0,
          unitPricePaise: Number(i.unitPricePaise) || 0,
          lineTotalPaise: Number(i.lineTotalPaise) || 0,
        }))
      : [],
    subtotalPaise: Number(o.subtotalPaise) || 0,
    discountPaise: Number(o.discountPaise) || 0,
    shippingPaise: Number(o.shippingPaise) || 0,
    taxPaise: Number(o.taxPaise) || 0,
    totalPaise: Number(o.totalPaise) || 0,
    shippingMethod: String(o.shippingMethod ?? ''),
    couponCode: typeof o.couponCode === 'string' ? o.couponCode : null,
    paymentProvider: typeof o.paymentProvider === 'string' ? o.paymentProvider : null,
    paymentStatus: typeof o.paymentStatus === 'string' ? o.paymentStatus : null,
  };
}
