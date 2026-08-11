import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PurchaseOrderStatus, type Prisma } from '@prisma/client';
import type {
  AdminPurchaseOrdersQuery,
  AdminSuppliersQuery,
  CreatePurchaseOrderBody,
  CreateSupplierBody,
  UpdateSupplierBody,
} from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  canTransitionPurchaseOrder,
  type PurchaseOrderStatus as PoStatus,
} from './purchase-order-lifecycle';

@Injectable()
export class ProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly inventory: InventoryService,
  ) {}

  async listSuppliers(query: AdminSuppliersQuery = {}) {
    const where: Prisma.SupplierWhereInput = {};
    if (query.q?.trim()) {
      const term = query.q.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { city: { contains: term, mode: 'insensitive' } },
      ];
    }
    if (query.active === '1' || query.active === 'true') where.isActive = true;
    if (query.active === '0' || query.active === 'false') where.isActive = false;

    const rows = await this.prisma.supplier.findMany({
      where,
      orderBy: [{ name: 'asc' }],
      take: 200,
      include: { _count: { select: { purchaseOrders: true } } },
    });
    return rows.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      contactName: s.contactName,
      email: s.email,
      phone: s.phone,
      city: s.city,
      state: s.state,
      gstin: s.gstin,
      notes: s.notes,
      isActive: s.isActive,
      poCount: s._count.purchaseOrders,
      createdAt: s.createdAt,
    }));
  }

  async createSupplier(body: CreateSupplierBody, actorId: string, requestId?: string) {
    try {
      const created = await this.prisma.supplier.create({
        data: {
          code: body.code,
          name: body.name,
          contactName: body.contactName,
          email: body.email,
          phone: body.phone,
          city: body.city ?? 'New Delhi',
          state: body.state ?? 'DL',
          gstin: body.gstin,
          notes: body.notes,
          isActive: body.isActive ?? true,
        },
      });
      await this.audit.write({
        actorId,
        action: 'supplier.created',
        resource: 'supplier',
        resourceId: created.id,
        metadata: { code: created.code },
        requestId,
      });
      return created;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Unique constraint')) {
        throw new BadRequestException({ code: 'CODE_TAKEN', message: 'Supplier code already exists.' });
      }
      throw e;
    }
  }

  async updateSupplier(
    id: string,
    body: UpdateSupplierBody,
    actorId: string,
    requestId?: string,
  ) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Supplier not found.' });
    }
    try {
      const updated = await this.prisma.supplier.update({
        where: { id },
        data: {
          ...(body.code !== undefined ? { code: body.code } : {}),
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.contactName !== undefined ? { contactName: body.contactName } : {}),
          ...(body.email !== undefined ? { email: body.email } : {}),
          ...(body.phone !== undefined ? { phone: body.phone } : {}),
          ...(body.city !== undefined ? { city: body.city } : {}),
          ...(body.state !== undefined ? { state: body.state } : {}),
          ...(body.gstin !== undefined ? { gstin: body.gstin } : {}),
          ...(body.notes !== undefined ? { notes: body.notes } : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        },
      });
      await this.audit.write({
        actorId,
        action: 'supplier.updated',
        resource: 'supplier',
        resourceId: id,
        requestId,
      });
      return updated;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Unique constraint')) {
        throw new BadRequestException({ code: 'CODE_TAKEN', message: 'Supplier code already exists.' });
      }
      throw e;
    }
  }

  async listPurchaseOrders(query: AdminPurchaseOrdersQuery = {}) {
    const where: Prisma.PurchaseOrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.q?.trim()) {
      const term = query.q.trim();
      where.OR = [
        { poNumber: { contains: term, mode: 'insensitive' } },
        { supplier: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }
    const rows = await this.prisma.purchaseOrder.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
      include: {
        supplier: { select: { id: true, code: true, name: true, city: true } },
        lines: { select: { id: true, quantityOrdered: true, unitCostPaise: true } },
      },
    });
    return rows.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      notes: po.notes,
      orderedAt: po.orderedAt,
      receivedAt: po.receivedAt,
      createdAt: po.createdAt,
      supplier: po.supplier,
      lineCount: po.lines.length,
      totalCostPaise: po.lines.reduce((s, l) => s + l.unitCostPaise * l.quantityOrdered, 0),
    }));
  }

  async getPurchaseOrder(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        lines: {
          include: {
            variant: {
              select: {
                id: true,
                sku: true,
                label: true,
                product: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });
    if (!po) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Purchase order not found.' });
    }
    return this.mapPoDetail(po);
  }

  async createPurchaseOrder(
    body: CreatePurchaseOrderBody,
    actorId: string,
    requestId?: string,
  ) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: body.supplierId } });
    if (!supplier || !supplier.isActive) {
      throw new BadRequestException({
        code: 'INVALID_SUPPLIER',
        message: 'Supplier not found or inactive.',
      });
    }

    const variantIds = [...new Set(body.lines.map((l) => l.variantId))];
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { title: true } } },
    });
    if (variants.length !== variantIds.length) {
      throw new BadRequestException({
        code: 'INVALID_VARIANTS',
        message: 'One or more variants were not found.',
      });
    }
    const byId = new Map(variants.map((v) => [v.id, v]));

    const year = new Date().getFullYear();
    const count = await this.prisma.purchaseOrder.count({
      where: { poNumber: { startsWith: `PO-${year}-` } },
    });
    const poNumber = `PO-${year}-${String(count + 1).padStart(4, '0')}`;

    const created = await this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: body.supplierId,
        notes: body.notes,
        createdById: actorId,
        status: PurchaseOrderStatus.DRAFT,
        lines: {
          create: body.lines.map((l) => {
            const v = byId.get(l.variantId)!;
            return {
              variantId: l.variantId,
              sku: v.sku,
              title: v.product.title,
              quantityOrdered: l.quantityOrdered,
              unitCostPaise: l.unitCostPaise,
            };
          }),
        },
      },
      include: {
        supplier: true,
        lines: {
          include: {
            variant: {
              select: {
                id: true,
                sku: true,
                label: true,
                product: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });

    await this.audit.write({
      actorId,
      action: 'purchase_order.created',
      resource: 'purchase_order',
      resourceId: created.id,
      metadata: { poNumber: created.poNumber, lineCount: created.lines.length },
      requestId,
    });
    return this.mapPoDetail(created);
  }

  async markOrdered(id: string, actorId: string, requestId?: string) {
    return this.transition(id, 'ORDERED', actorId, requestId);
  }

  async cancel(id: string, actorId: string, requestId?: string) {
    return this.transition(id, 'CANCELLED', actorId, requestId);
  }

  async receive(id: string, actorId: string, requestId?: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { lines: true, supplier: true },
    });
    if (!po) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Purchase order not found.' });
    }
    if (!canTransitionPurchaseOrder(po.status as PoStatus, 'RECEIVED')) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot receive a ${po.status} purchase order.`,
      });
    }
    if (!po.lines.length) {
      throw new BadRequestException({
        code: 'NO_LINES',
        message: 'Purchase order has no lines.',
      });
    }

    for (const line of po.lines) {
      await this.inventory.adjustAdmin(
        line.variantId,
        {
          delta: line.quantityOrdered,
          reason: 'RECEIVE',
          note: `PO ${po.poNumber} · ${po.supplier.name}`,
        },
        actorId,
        requestId,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const line of po.lines) {
        await tx.purchaseOrderLine.update({
          where: { id: line.id },
          data: { quantityReceived: line.quantityOrdered },
        });
      }
      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: PurchaseOrderStatus.RECEIVED,
          receivedAt: new Date(),
        },
      });
    });

    await this.audit.write({
      actorId,
      action: 'purchase_order.received',
      resource: 'purchase_order',
      resourceId: id,
      metadata: {
        poNumber: po.poNumber,
        lines: po.lines.map((l) => ({
          sku: l.sku,
          qty: l.quantityOrdered,
          unitCostPaise: l.unitCostPaise,
        })),
      },
      requestId,
    });

    return this.getPurchaseOrder(id);
  }

  private async transition(
    id: string,
    to: PoStatus,
    actorId: string,
    requestId?: string,
  ) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Purchase order not found.' });
    }
    if (!canTransitionPurchaseOrder(po.status as PoStatus, to)) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot change ${po.status} → ${to}.`,
      });
    }
    const data: Prisma.PurchaseOrderUpdateInput = {
      status: to as PurchaseOrderStatus,
    };
    if (to === 'ORDERED') data.orderedAt = new Date();
    await this.prisma.purchaseOrder.update({ where: { id }, data });
    await this.audit.write({
      actorId,
      action: to === 'ORDERED' ? 'purchase_order.ordered' : 'purchase_order.cancelled',
      resource: 'purchase_order',
      resourceId: id,
      metadata: { poNumber: po.poNumber, from: po.status, to },
      requestId,
    });
    return this.getPurchaseOrder(id);
  }

  private mapPoDetail(
    po: {
      id: string;
      poNumber: string;
      status: PurchaseOrderStatus;
      notes: string | null;
      orderedAt: Date | null;
      receivedAt: Date | null;
      createdAt: Date;
      supplier: {
        id: string;
        code: string;
        name: string;
        city: string | null;
        state: string | null;
        contactName: string | null;
        email: string | null;
        phone: string | null;
      };
      lines: Array<{
        id: string;
        variantId: string;
        sku: string;
        title: string;
        quantityOrdered: number;
        quantityReceived: number;
        unitCostPaise: number;
        variant: {
          id: string;
          sku: string;
          label: string;
          product: { id: string; title: string };
        };
      }>;
    },
  ) {
    return {
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      notes: po.notes,
      orderedAt: po.orderedAt,
      receivedAt: po.receivedAt,
      createdAt: po.createdAt,
      supplier: po.supplier,
      totalCostPaise: po.lines.reduce((s, l) => s + l.unitCostPaise * l.quantityOrdered, 0),
      lines: po.lines.map((l) => ({
        id: l.id,
        variantId: l.variantId,
        sku: l.sku,
        title: l.title,
        label: l.variant.label,
        productId: l.variant.product.id,
        quantityOrdered: l.quantityOrdered,
        quantityReceived: l.quantityReceived,
        unitCostPaise: l.unitCostPaise,
        lineCostPaise: l.unitCostPaise * l.quantityOrdered,
      })),
    };
  }
}
