import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AdminCouponsQuery, CreateCouponBody } from '@inabiya/validation';
import { OrderStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  adminCouponKeysetAfter,
  decodeAdminCouponCursor,
  encodeAdminCouponCursor,
} from './admin-coupons-cursor';
import {
  eligibilityNeedsCustomer,
  eligibilitySatisfied,
  parseCouponEligibility,
  parseCouponMatchRules,
} from './coupon-conditions';
import {
  computeDiscountPaise,
  couponLifecycle,
  eligibleSubtotalPaise,
  matchingQtyFromLines,
  scopeMatchingLines,
  type CouponCartLine,
  type CouponScopeKind,
} from './coupon-lifecycle';
import { buildConflictCodesById, couponConflictPeerSelect, toCouponConflictSlice } from './coupon-overlap';

export type CouponResult = {
  code: string;
  discountPaise: number;
  eligibleSubtotalPaise: number;
  scope: CouponScopeKind;
};

export type CouponValidateContext = {
  userId?: string | null;
  shippingMethod?: 'STANDARD' | 'EXPRESS' | null;
  /** When set (CART nested after a line coupon), percent/fixed apply to this remaining subtotal. Min still uses eligible. */
  discountBasePaise?: number;
};

const COUNTED_ORDER: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

const REDEEM_ORDER: OrderStatus[] = [...COUNTED_ORDER, OrderStatus.PENDING_PAYMENT];

function parseOptionalDate(raw: string | undefined, field: string): Date | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException({
      code: 'INVALID_DATE',
      message: `Invalid ${field}.`,
    });
  }
  return d;
}

function normalizeScopeIds(
  scope: CouponScopeKind,
  productIds: string[] | undefined,
  collectionIds: string[] | undefined,
): { productIds: string[]; collectionIds: string[] } {
  if (scope === 'PRODUCT') {
    return {
      productIds: [...new Set(productIds ?? [])],
      collectionIds: [],
    };
  }
  if (scope === 'COLLECTION') {
    return {
      productIds: [],
      collectionIds: [...new Set(collectionIds ?? [])],
    };
  }
  return { productIds: [], collectionIds: [] };
}

@Injectable()
export class CouponService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listAdmin(query: AdminCouponsQuery = { limit: 25 }) {
    const limit = query.limit ?? 25;
    const andParts: Prisma.CouponWhereInput[] = [];

    if (query.cursor) {
      try {
        andParts.push(
          adminCouponKeysetAfter(decodeAdminCouponCursor(query.cursor)) as Prisma.CouponWhereInput,
        );
      } catch {
        throw new BadRequestException({
          code: 'INVALID_CURSOR',
          message: 'Invalid pagination cursor.',
        });
      }
    }

    const where: Prisma.CouponWhereInput = andParts.length > 0 ? { AND: andParts } : {};
    const rows = await this.prisma.coupon.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last ? encodeAdminCouponCursor({ createdAt: last.createdAt, id: last.id }) : null;

    const productIdSet = new Set(page.flatMap((c) => c.productIds));
    const collectionIdSet = new Set(page.flatMap((c) => c.collectionIds));
    const [products, collections] = await Promise.all([
      productIdSet.size
        ? this.prisma.product.findMany({
            where: { id: { in: [...productIdSet] } },
            select: { id: true, title: true, slug: true },
          })
        : Promise.resolve([]),
      collectionIdSet.size
        ? this.prisma.collection.findMany({
            where: { id: { in: [...collectionIdSet] } },
            select: { id: true, title: true, slug: true },
          })
        : Promise.resolve([]),
    ]);
    const productMap = new Map(products.map((p) => [p.id, p]));
    const collectionMap = new Map(collections.map((c) => [c.id, c]));
    const now = new Date();

    const peerRows = await this.prisma.coupon.findMany({
      where: { active: true },
      select: couponConflictPeerSelect,
    });
    const peers = peerRows.map(toCouponConflictSlice);
    const conflictsById = buildConflictCodesById(peers, now);

    const items = page.map((c) => {
      const type = c.discountPercent != null ? ('PERCENT' as const) : ('FIXED_PAISE' as const);
      const matchRules = parseCouponMatchRules(c.matchRules);
      const eligibility = parseCouponEligibility(c.eligibility);
      return {
        id: c.id,
        code: c.code,
        description: c.description,
        type,
        discountPaise: c.discountPaise,
        discountPercent: c.discountPercent,
        minSubtotalPaise: c.minSubtotalPaise,
        maxDiscountPaise: c.maxDiscountPaise,
        maxUses: c.maxUses,
        maxUsesPerCustomer: c.maxUsesPerCustomer,
        usedCount: c.usedCount,
        active: c.active,
        startsAt: c.startsAt,
        expiresAt: c.expiresAt,
        scope: c.scope as CouponScopeKind,
        productIds: c.productIds,
        collectionIds: c.collectionIds,
        matchRules,
        eligibility,
        products: c.productIds
          .map((id) => productMap.get(id))
          .filter(Boolean)
          .map((p) => ({ id: p!.id, title: p!.title, slug: p!.slug })),
        collections: c.collectionIds
          .map((id) => collectionMap.get(id))
          .filter(Boolean)
          .map((col) => ({ id: col!.id, title: col!.title, slug: col!.slug })),
        createdAt: c.createdAt,
        status: couponLifecycle(c, now),
        conflictsWith: conflictsById.get(c.id) ?? [],
      };
    });

    return { items, nextCursor, limit };
  }

  async createAdmin(body: CreateCouponBody, actorId: string, requestId?: string) {
    const startsAt = parseOptionalDate(body.startsAt, 'startsAt');
    const expiresAt = parseOptionalDate(body.expiresAt, 'expiresAt');
    if (startsAt && expiresAt && expiresAt <= startsAt) {
      throw new BadRequestException({
        code: 'INVALID_SCHEDULE',
        message: 'expiresAt must be after startsAt.',
      });
    }

    const scope = (body.scope ?? 'CART') as CouponScopeKind;
    const ids = normalizeScopeIds(scope, body.productIds, body.collectionIds);

    if (scope === 'PRODUCT' && ids.productIds.length) {
      const found = await this.prisma.product.count({
        where: { id: { in: ids.productIds } },
      });
      if (found !== ids.productIds.length) {
        throw new BadRequestException({
          code: 'INVALID_PRODUCTS',
          message: 'One or more products were not found.',
        });
      }
    }
    if (scope === 'COLLECTION' && ids.collectionIds.length) {
      const found = await this.prisma.collection.count({
        where: { id: { in: ids.collectionIds }, membershipMode: 'MANUAL' },
      });
      if (found !== ids.collectionIds.length) {
        throw new BadRequestException({
          code: 'INVALID_COLLECTIONS',
          message: 'One or more hand-picked collections were not found.',
        });
      }
    }

    const matchRules = scope === 'MATCHING' ? (body.matchRules ?? null) : null;
    const eligibility =
      body.eligibility?.conditions.length ? body.eligibility : null;

    const created = await this.prisma.coupon.create({
      data: {
        code: body.code.toUpperCase(),
        description: body.description,
        discountPaise: body.discountPaise ?? null,
        discountPercent: body.discountPercent ?? null,
        minSubtotalPaise: body.minSubtotalPaise ?? 0,
        maxDiscountPaise: body.maxDiscountPaise ?? null,
        maxUses: body.maxUses ?? null,
        maxUsesPerCustomer: body.maxUsesPerCustomer ?? null,
        active: body.active ?? true,
        startsAt,
        expiresAt,
        scope,
        productIds: ids.productIds,
        collectionIds: ids.collectionIds,
        matchRules: matchRules ?? undefined,
        eligibility: eligibility ?? undefined,
      },
    });

    await this.audit.write({
      actorId,
      action: 'coupon.created',
      resource: 'coupon',
      resourceId: created.id,
      metadata: {
        code: created.code,
        discountPaise: created.discountPaise,
        discountPercent: created.discountPercent,
        minSubtotalPaise: created.minSubtotalPaise,
        maxDiscountPaise: created.maxDiscountPaise,
        maxUses: created.maxUses,
        maxUsesPerCustomer: created.maxUsesPerCustomer,
        startsAt: created.startsAt,
        expiresAt: created.expiresAt,
        scope: created.scope,
        productIds: created.productIds,
        collectionIds: created.collectionIds,
        matchRules: created.matchRules,
        eligibility: created.eligibility,
      },
      requestId,
    });

    const now = new Date();
    const peerRows = await this.prisma.coupon.findMany({
      where: { active: true },
      select: couponConflictPeerSelect,
    });
    const peers = peerRows.map(toCouponConflictSlice);
    const conflictsWith = buildConflictCodesById(peers, now).get(created.id) ?? [];

    return { ...created, conflictsWith };
  }

  async setActive(code: string, active: boolean, actorId: string, requestId?: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Coupon not found.',
      });
    }
    const updated = await this.prisma.coupon.update({
      where: { code: coupon.code },
      data: { active },
    });
    await this.audit.write({
      actorId,
      action: active ? 'coupon.activated' : 'coupon.deactivated',
      resource: 'coupon',
      resourceId: updated.id,
      metadata: { code: updated.code, active },
      requestId,
    });
    return updated;
  }

  async validate(
    code: string,
    cartSubtotalPaise: number,
    lines?: CouponCartLine[] | null,
    ctx: CouponValidateContext = {},
  ): Promise<CouponResult> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon || !coupon.active) {
      throw new BadRequestException({
        code: 'INVALID_COUPON',
        message: 'Coupon is not valid.',
      });
    }
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException({
        code: 'INVALID_COUPON',
        message: 'Coupon is not valid.',
      });
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new BadRequestException({
        code: 'INVALID_COUPON',
        message: 'Coupon is not valid.',
      });
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException({
        code: 'INVALID_COUPON',
        message: 'Coupon is not valid.',
      });
    }

    const scope = coupon.scope as CouponScopeKind;
    const matchRules = parseCouponMatchRules(coupon.matchRules);
    const eligibility = parseCouponEligibility(coupon.eligibility);

    const eligible = eligibleSubtotalPaise({
      scope,
      productIds: coupon.productIds,
      collectionIds: coupon.collectionIds,
      cartSubtotalPaise,
      lines,
      matchRules,
    });

    if (scope !== 'CART' && eligible <= 0) {
      throw new BadRequestException({
        code: 'INVALID_COUPON',
        message: 'Coupon is not valid.',
      });
    }

    if (eligible < coupon.minSubtotalPaise) {
      throw new BadRequestException({
        code: 'INVALID_COUPON',
        message: 'Coupon is not valid.',
      });
    }

    const linesKnown = lines != null;
    const cartQty = linesKnown ? matchingQtyFromLines(lines) : 0;
    const scoped = linesKnown
      ? scopeMatchingLines({
          scope,
          productIds: coupon.productIds,
          collectionIds: coupon.collectionIds,
          matchRules,
          lines,
        })
      : [];
    const matchingQty = linesKnown ? matchingQtyFromLines(scoped) : 0;

    let paidOrderCount = 0;
    if (ctx.userId && (eligibilityNeedsCustomer(eligibility) || coupon.maxUsesPerCustomer != null)) {
      paidOrderCount = await this.prisma.order.count({
        where: { userId: ctx.userId, status: { in: COUNTED_ORDER } },
      });
    }

    if (coupon.maxUsesPerCustomer != null && ctx.userId) {
      const uses = await this.prisma.order.count({
        where: {
          userId: ctx.userId,
          status: { in: REDEEM_ORDER },
          OR: [{ couponCode: coupon.code }, { lineCouponCode: coupon.code }],
        },
      });
      if (uses >= coupon.maxUsesPerCustomer) {
        throw new BadRequestException({
          code: 'INVALID_COUPON',
          message: 'Coupon is not valid.',
        });
      }
    }

    const gatesOk = eligibilitySatisfied(eligibility, {
      cartQty,
      matchingQty,
      eligibleSubtotalPaise: eligible,
      paidOrderCount,
      shippingMethod: ctx.shippingMethod ?? null,
      linesUnknown: !linesKnown,
    });
    if (!gatesOk) {
      throw new BadRequestException({
        code: 'INVALID_COUPON',
        message: 'Coupon is not valid.',
      });
    }

    const discountBase =
      ctx.discountBasePaise != null
        ? Math.max(0, Math.min(ctx.discountBasePaise, eligible))
        : eligible;
    const discountPaise = computeDiscountPaise({
      subtotalPaise: discountBase,
      discountPaise: coupon.discountPaise,
      discountPercent: coupon.discountPercent,
      maxDiscountPaise: coupon.maxDiscountPaise,
    });

    return {
      code: coupon.code,
      discountPaise,
      eligibleSubtotalPaise: eligible,
      scope,
    };
  }

  async incrementUsage(code: string, tx?: Prisma.TransactionClient): Promise<void> {
    const db = tx ?? this.prisma;
    const updated = await db.$executeRaw`
      UPDATE coupons
      SET used_count = used_count + 1
      WHERE code = ${code}
        AND (max_uses IS NULL OR used_count < max_uses)
    `;
    if (Number(updated) === 0) {
      throw new BadRequestException({
        code: 'INVALID_COUPON',
        message: 'Coupon is not valid.',
      });
    }
  }
}
