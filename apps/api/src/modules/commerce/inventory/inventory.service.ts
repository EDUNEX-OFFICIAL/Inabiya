import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryMovementReason, OrderStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CommercePolicyService } from '../ops/commerce-policy.service';
import { HOLD_ORDER_STATUSES, sumHoldQuantity } from './inventory-reservations';

type Tx = Prisma.TransactionClient;

export type InventoryAdjustInput = {
  delta: number;
  reason: 'RECEIVE' | 'DAMAGE' | 'RECOUNT' | 'CORRECTION';
  note?: string;
};

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly policy: CommercePolicyService,
  ) {}

  async assertAvailable(items: Array<{ variantId: string; quantity: number }>): Promise<void> {
    for (const item of items) {
      const inv = await this.prisma.inventoryItem.findUnique({
        where: { variantId: item.variantId },
      });
      if (!inv) {
        throw new BadRequestException({
          code: 'OUT_OF_STOCK',
          message: 'Item is unavailable.',
        });
      }
      const available = inv.onHand - inv.reserved;
      if (available < item.quantity) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_STOCK',
          message: 'Not enough stock for one or more items.',
        });
      }
    }
  }

  async reserve(tx: Tx, items: Array<{ variantId: string; quantity: number }>): Promise<void> {
    for (const item of items) {
      const inv = await tx.inventoryItem.findUnique({
        where: { variantId: item.variantId },
      });
      if (!inv || inv.onHand - inv.reserved < item.quantity) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_STOCK',
          message: 'Not enough stock for one or more items.',
        });
      }
      await tx.inventoryItem.update({
        where: { variantId: item.variantId },
        data: { reserved: { increment: item.quantity } },
      });
    }
  }

  async release(items: Array<{ variantId: string; quantity: number }>): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inv = await tx.inventoryItem.findUnique({
          where: { variantId: item.variantId },
        });
        if (!inv) continue;
        const releaseQty = Math.min(item.quantity, inv.reserved);
        if (releaseQty > 0) {
          await tx.inventoryItem.update({
            where: { variantId: item.variantId },
            data: { reserved: { decrement: releaseQty } },
          });
        }
      }
    });
  }

  async commit(items: Array<{ variantId: string; quantity: number }>): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inv = await tx.inventoryItem.findUnique({
          where: { variantId: item.variantId },
        });
        if (!inv) {
          throw new NotFoundException({
            code: 'INVENTORY_NOT_FOUND',
            message: 'Inventory record missing.',
          });
        }
        const qty = Math.min(item.quantity, inv.reserved);
        await tx.inventoryItem.update({
          where: { variantId: item.variantId },
          data: {
            onHand: { decrement: qty },
            reserved: { decrement: qty },
          },
        });
      }
    });
  }

  /** After paid cancel/refund — return committed stock to onHand. */
  async restock(items: Array<{ variantId: string; quantity: number }>): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inv = await tx.inventoryItem.findUnique({
          where: { variantId: item.variantId },
        });
        if (!inv || item.quantity <= 0) continue;
        await tx.inventoryItem.update({
          where: { variantId: item.variantId },
          data: { onHand: { increment: item.quantity } },
        });
      }
    });
  }

  // --- OPS-3 admin desk ---

  async listAdmin(query: { q?: string; lowStock?: boolean; threshold?: number } = {}) {
    const threshold = query.threshold ?? (await this.policy.getLowStockThreshold());
    const where: Prisma.InventoryItemWhereInput = {};

    if (query.q?.trim()) {
      const term = query.q.trim();
      where.variant = {
        OR: [
          { sku: { contains: term, mode: 'insensitive' } },
          { label: { contains: term, mode: 'insensitive' } },
          { product: { title: { contains: term, mode: 'insensitive' } } },
        ],
      };
    }

    const rows = await this.prisma.inventoryItem.findMany({
      where,
      take: 200,
      orderBy: { onHand: 'asc' },
      include: {
        variant: {
          include: { product: { select: { id: true, title: true, slug: true, status: true } } },
        },
      },
    });

    const mapped = rows.map((r) => {
      const available = r.onHand - r.reserved;
      return {
        inventoryId: r.id,
        variantId: r.variantId,
        sku: r.variant.sku,
        label: r.variant.label,
        productId: r.variant.product.id,
        productTitle: r.variant.product.title,
        productSlug: r.variant.product.slug,
        productStatus: r.variant.product.status,
        onHand: r.onHand,
        reserved: r.reserved,
        available,
        lowStock: available <= threshold,
      };
    });

    if (query.lowStock) {
      return mapped.filter((r) => r.lowStock);
    }
    return mapped;
  }

  async movements(variantId: string, take = 50) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Variant not found.' });
    }
    const rows = await this.prisma.inventoryMovement.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, take)),
      include: { actor: { select: { email: true } } },
    });
    return rows.map((m) => ({
      id: m.id,
      deltaOnHand: m.deltaOnHand,
      reason: m.reason,
      note: m.note,
      onHandAfter: m.onHandAfter,
      reservedAfter: m.reservedAfter,
      actorEmail: m.actor?.email ?? null,
      createdAt: m.createdAt,
    }));
  }

  /**
   * OPS-3 P1 — which PENDING_PAYMENT orders currently hold this SKU.
   * Counter `InventoryItem.reserved` is still source of truth for available math;
   * this list explains the holds for ops triage.
   */
  async listReservations(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true },
    });
    if (!variant) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Variant not found.' });
    }

    const holdStatuses = HOLD_ORDER_STATUSES as unknown as OrderStatus[];
    const lines = await this.prisma.orderItem.findMany({
      where: {
        variantId,
        order: { status: { in: holdStatuses } },
      },
      orderBy: { order: { createdAt: 'desc' } },
      take: 100,
      select: {
        id: true,
        quantity: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    const holds = lines.map((line) => ({
      orderItemId: line.id,
      orderId: line.order.id,
      orderNumber: line.order.orderNumber,
      status: line.order.status,
      quantity: line.quantity,
      customerEmail: line.order.user.email,
      createdAt: line.order.createdAt,
    }));

    const reserved = variant.inventory?.reserved ?? 0;
    const heldQty = sumHoldQuantity(holds);

    return {
      variantId,
      sku: variant.sku,
      reserved,
      heldQty,
      holds,
    };
  }

  /**
   * Relative adjust — never lets onHand go below reserved (available never negative).
   */
  async adjustAdmin(
    variantId: string,
    input: InventoryAdjustInput,
    actorId: string,
    requestId?: string,
  ) {
    if (!Number.isInteger(input.delta) || input.delta === 0) {
      throw new BadRequestException({
        code: 'INVALID_DELTA',
        message: 'Adjustment delta must be a non-zero integer.',
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let inv = await tx.inventoryItem.findUnique({ where: { variantId } });
      if (!inv) {
        inv = await tx.inventoryItem.create({
          data: { variantId, onHand: 0, reserved: 0 },
        });
      }

      const nextOnHand = inv.onHand + input.delta;
      if (nextOnHand < 0) {
        throw new BadRequestException({
          code: 'NEGATIVE_STOCK',
          message: 'On-hand stock cannot become negative.',
        });
      }
      if (nextOnHand < inv.reserved) {
        throw new BadRequestException({
          code: 'AVAILABLE_NEGATIVE',
          message: `Cannot set on-hand below reserved (${inv.reserved}). Available would go negative.`,
        });
      }

      const updated = await tx.inventoryItem.update({
        where: { variantId },
        data: { onHand: nextOnHand },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          variantId,
          inventoryId: updated.id,
          deltaOnHand: input.delta,
          reason: input.reason as InventoryMovementReason,
          note: input.note?.trim() || null,
          actorId,
          onHandAfter: updated.onHand,
          reservedAfter: updated.reserved,
        },
      });

      return { updated, movement };
    });

    await this.audit.write({
      actorId,
      action: 'inventory.adjusted',
      resource: 'variant',
      resourceId: variantId,
      metadata: {
        delta: input.delta,
        reason: input.reason,
        onHandAfter: result.updated.onHand,
        reservedAfter: result.updated.reserved,
        movementId: result.movement.id,
      },
      requestId,
    });

    return {
      variantId,
      onHand: result.updated.onHand,
      reserved: result.updated.reserved,
      available: result.updated.onHand - result.updated.reserved,
      movementId: result.movement.id,
    };
  }

  /** Absolute set used by catalog admin — also writes CORRECTION movement. */
  async setOnHandAdmin(
    variantId: string,
    onHand: number,
    actorId: string,
    requestId?: string,
  ) {
    if (!Number.isInteger(onHand) || onHand < 0) {
      throw new BadRequestException({
        code: 'INVALID_ON_HAND',
        message: 'onHand must be a non-negative integer.',
      });
    }

    const existing = await this.prisma.inventoryItem.findUnique({ where: { variantId } });
    const current = existing?.onHand ?? 0;
    const delta = onHand - current;
    if (delta === 0 && existing) {
      return {
        variantId,
        onHand: existing.onHand,
        reserved: existing.reserved,
        available: existing.onHand - existing.reserved,
      };
    }
    if (delta === 0) {
      const created = await this.prisma.inventoryItem.create({
        data: { variantId, onHand: 0, reserved: 0 },
      });
      return {
        variantId,
        onHand: created.onHand,
        reserved: created.reserved,
        available: 0,
      };
    }
    return this.adjustAdmin(
      variantId,
      { delta, reason: 'CORRECTION', note: 'Absolute on-hand set from catalog' },
      actorId,
      requestId,
    );
  }

  /** OPS-9 — CSV stock import by SKU (dry-run validates without mutating). */
  async importBySku(
    input: {
      dryRun: boolean;
      rows: Array<{
        sku: string;
        delta: number;
        reason: 'RECEIVE' | 'DAMAGE' | 'RECOUNT' | 'CORRECTION';
        note?: string;
      }>;
    },
    actorId: string,
    requestId?: string,
  ) {
    const results: Array<{
      row: number;
      sku: string;
      ok: boolean;
      error?: string;
      variantId?: string;
      availableAfter?: number;
    }> = [];

    for (let i = 0; i < input.rows.length; i++) {
      const row = input.rows[i]!;
      const sku = row.sku.trim();
      const variant = await this.prisma.productVariant.findFirst({
        where: { sku: { equals: sku, mode: 'insensitive' } },
        include: { inventory: true },
      });
      if (!variant) {
        results.push({ row: i + 1, sku, ok: false, error: 'SKU not found' });
        continue;
      }
      const onHand = variant.inventory?.onHand ?? 0;
      const reserved = variant.inventory?.reserved ?? 0;
      const next = onHand + row.delta;
      if (next < 0) {
        results.push({ row: i + 1, sku, ok: false, error: 'Would make on-hand negative' });
        continue;
      }
      if (next < reserved) {
        results.push({
          row: i + 1,
          sku,
          ok: false,
          error: `Would go below reserved (${reserved})`,
        });
        continue;
      }

      if (input.dryRun) {
        results.push({
          row: i + 1,
          sku,
          ok: true,
          variantId: variant.id,
          availableAfter: next - reserved,
        });
        continue;
      }

      try {
        const adjusted = await this.adjustAdmin(
          variant.id,
          { delta: row.delta, reason: row.reason, note: row.note },
          actorId,
          requestId,
        );
        results.push({
          row: i + 1,
          sku,
          ok: true,
          variantId: variant.id,
          availableAfter: adjusted.available,
        });
      } catch (e) {
        results.push({
          row: i + 1,
          sku,
          ok: false,
          error: e instanceof Error ? e.message : 'adjust failed',
        });
      }
    }

    if (!input.dryRun) {
      await this.audit.write({
        actorId,
        action: 'inventory.import',
        resource: 'inventory',
        metadata: {
          dryRun: false,
          total: results.length,
          ok: results.filter((r) => r.ok).length,
          failed: results.filter((r) => !r.ok).length,
        },
        requestId,
      });
    }

    return {
      dryRun: input.dryRun,
      total: results.length,
      okCount: results.filter((r) => r.ok).length,
      errorCount: results.filter((r) => !r.ok).length,
      results,
    };
  }
}
