import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus, ReturnStatus } from '@prisma/client';
import type { CreateReturnBody, ModerateReturnBody } from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { PaymentsService } from '../../../infrastructure/payments/payments.service';
import { AuditService } from '../../audit/audit.service';
import { CommercePolicyService } from '../ops/commerce-policy.service';

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: CommercePolicyService,
    private readonly payments: PaymentsService,
    private readonly audit: AuditService,
  ) {}

  async getPolicy() {
    return this.policy.getReturnPolicy();
  }

  async eligibility(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        statusHistory: { orderBy: { createdAt: 'asc' } },
        returnRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!order) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found.' });
    }
    const { windowDays } = await this.policy.getReturnPolicy();
    const deliveredAt = order.statusHistory.find(
      (h) => h.status === OrderStatus.DELIVERED,
    )?.createdAt;
    const open = order.returnRequests.find(
      (r) =>
        r.status === ReturnStatus.REQUESTED ||
        r.status === ReturnStatus.APPROVED ||
        r.status === ReturnStatus.REFUNDED,
    );
    let eligible = false;
    let reason: string | null = null;
    let daysLeft: number | null = null;
    if (order.status !== OrderStatus.DELIVERED) {
      reason = 'Returns are only available after delivery.';
    } else if (!deliveredAt) {
      reason = 'Delivery date missing.';
    } else if (open) {
      reason = `A return is already ${open.status.toLowerCase()}.`;
    } else {
      const deadline = new Date(deliveredAt);
      deadline.setUTCDate(deadline.getUTCDate() + windowDays);
      const msLeft = deadline.getTime() - Date.now();
      daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
      if (msLeft < 0) {
        reason = `Return window of ${windowDays} days has expired.`;
      } else {
        eligible = true;
      }
    }
    return {
      eligible,
      reason,
      windowDays,
      daysLeft,
      deliveredAt: deliveredAt ?? null,
      existing: order.returnRequests.map((r) => ({
        id: r.id,
        status: r.status,
        reason: r.reason,
        createdAt: r.createdAt,
      })),
    };
  }

  async request(userId: string, orderId: string, body: CreateReturnBody, requestId?: string) {
    const check = await this.eligibility(userId, orderId);
    if (!check.eligible) {
      throw new BadRequestException({
        code: 'RETURN_NOT_ELIGIBLE',
        message: check.reason ?? 'Not eligible for return.',
      });
    }
    const row = await this.prisma.returnRequest.create({
      data: {
        orderId,
        userId,
        reason: body.reason,
        status: ReturnStatus.REQUESTED,
      },
    });
    await this.audit.write({
      actorId: userId,
      action: 'return.requested',
      resource: 'return_request',
      resourceId: row.id,
      metadata: { orderId, reason: body.reason },
      requestId,
    });
    return row;
  }

  async listMine(userId: string) {
    return this.prisma.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { order: { select: { orderNumber: true, status: true } } },
    });
  }

  async listAdmin(status?: ReturnStatus) {
    const rows = await this.prisma.returnRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        order: { select: { id: true, orderNumber: true, status: true, totalPaise: true } },
        user: { select: { email: true, displayName: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      reason: r.reason,
      adminNote: r.adminNote,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      order: r.order,
      customerEmail: r.user.email,
      customerName: r.user.displayName,
    }));
  }

  async moderate(returnId: string, body: ModerateReturnBody, actorId: string, requestId?: string) {
    const row = await this.prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        order: { include: { items: true, payments: true } },
      },
    });
    if (!row) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Return not found.' });
    }
    if (row.status !== ReturnStatus.REQUESTED) {
      throw new BadRequestException({
        code: 'INVALID_STATE',
        message: `Return is already ${row.status}.`,
      });
    }

    if (body.status === 'REJECTED') {
      const updated = await this.prisma.returnRequest.update({
        where: { id: returnId },
        data: {
          status: ReturnStatus.REJECTED,
          adminNote: body.adminNote ?? null,
          resolvedAt: new Date(),
          resolvedById: actorId,
        },
      });
      await this.audit.write({
        actorId,
        action: 'return.rejected',
        resource: 'return_request',
        resourceId: returnId,
        metadata: { note: body.adminNote ?? null },
        requestId,
      });
      return updated;
    }

    // APPROVED → mock refund + restock + order RETURNED + return REFUNDED
    if (row.order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException({
        code: 'INVALID_ORDER_STATE',
        message: 'Only delivered orders can be refunded via return.',
      });
    }

    // Claim return row first (prevents double-approve race)
    const claimedReturn = await this.prisma.returnRequest.updateMany({
      where: { id: returnId, status: ReturnStatus.REQUESTED },
      data: {
        status: ReturnStatus.APPROVED,
        adminNote: body.adminNote ?? null,
      },
    });
    if (claimedReturn.count === 0) {
      throw new BadRequestException({
        code: 'ALREADY_RESOLVED',
        message: 'Return already moderated.',
      });
    }

    const captured = row.order.payments.filter((p) => p.status === PaymentStatus.CAPTURED);
    const refundIds: string[] = [];
    for (const payment of captured) {
      const claimedPay = await this.prisma.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.CAPTURED },
        data: { status: PaymentStatus.REFUNDED },
      });
      if (claimedPay.count === 0) continue;
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
        await this.prisma.returnRequest.update({
          where: { id: returnId },
          data: { status: ReturnStatus.REQUESTED },
        });
        throw err;
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of row.order.items) {
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
      await tx.order.update({
        where: { id: row.orderId },
        data: {
          status: OrderStatus.RETURNED,
          statusHistory: {
            create: {
              status: OrderStatus.RETURNED,
              note: 'Return approved — refund processed',
            },
          },
        },
      });
      await tx.returnRequest.update({
        where: { id: returnId },
        data: {
          status: ReturnStatus.REFUNDED,
          resolvedAt: new Date(),
          resolvedById: actorId,
        },
      });
    });

    await this.audit.write({
      actorId,
      action: 'return.approved.refunded',
      resource: 'return_request',
      resourceId: returnId,
      metadata: { orderId: row.orderId, refundIds },
      requestId,
    });

    return this.prisma.returnRequest.findUniqueOrThrow({ where: { id: returnId } });
  }
}
