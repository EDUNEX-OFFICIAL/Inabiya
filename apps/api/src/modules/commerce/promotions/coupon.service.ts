import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AdminCouponsQuery, CouponPreviewBody, CreateCouponBody } from '@inabiya/validation';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  adminCouponKeysetAfter,
  decodeAdminCouponCursor,
  encodeAdminCouponCursor,
} from './admin-coupons-cursor';
import {
  computeDiscountPaise,
  couponLifecycle,
  eligibleSubtotalPaise,
  type CouponCartLine,
  type CouponScopeKind,
} from './coupon-lifecycle';
import { buildConflictCodesById, type CouponConflictSlice } from './coupon-overlap';

export type CouponResult = {
  code: string;
  discountPaise: number;
  eligibleSubtotalPaise: number;
  scope: CouponScopeKind;
};

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
      select: {
        id: true,
        code: true,
        active: true,
        startsAt: true,
        expiresAt: true,
        maxUses: true,
        usedCount: true,
        scope: true,
        productIds: true,
        collectionIds: true,
      },
    });
    const peers: CouponConflictSlice[] = peerRows.map((c) => ({
      id: c.id,
      code: c.code,
      active: c.active,
      startsAt: c.startsAt,
      expiresAt: c.expiresAt,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      scope: c.scope as CouponScopeKind,
      productIds: c.productIds,
      collectionIds: c.collectionIds,
    }));
    const conflictsById = buildConflictCodesById(peers, now);

    const items = page.map((c) => {
      const type = c.discountPercent != null ? ('PERCENT' as const) : ('FIXED_PAISE' as const);
      return {
        id: c.id,
        code: c.code,
        description: c.description,
        type,
        discountPaise: c.discountPaise,
        discountPercent: c.discountPercent,
        minSubtotalPaise: c.minSubtotalPaise,
        maxUses: c.maxUses,
        usedCount: c.usedCount,
        active: c.active,
        startsAt: c.startsAt,
        expiresAt: c.expiresAt,
        scope: c.scope as CouponScopeKind,
        productIds: c.productIds,
        collectionIds: c.collectionIds,
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

    const created = await this.prisma.coupon.create({
      data: {
        code: body.code.toUpperCase(),
        description: body.description,
        discountPaise: body.discountPaise ?? null,
        discountPercent: body.discountPercent ?? null,
        minSubtotalPaise: body.minSubtotalPaise ?? 0,
        maxUses: body.maxUses ?? null,
        active: body.active ?? true,
        startsAt,
        expiresAt,
        scope,
        productIds: ids.productIds,
        collectionIds: ids.collectionIds,
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
        maxUses: created.maxUses,
        startsAt: created.startsAt,
        expiresAt: created.expiresAt,
        scope: created.scope,
        productIds: created.productIds,
        collectionIds: created.collectionIds,
      },
      requestId,
    });

    const now = new Date();
    const peerRows = await this.prisma.coupon.findMany({
      where: { active: true },
      select: {
        id: true,
        code: true,
        active: true,
        startsAt: true,
        expiresAt: true,
        maxUses: true,
        usedCount: true,
        scope: true,
        productIds: true,
        collectionIds: true,
      },
    });
    const peers: CouponConflictSlice[] = peerRows.map((c) => ({
      id: c.id,
      code: c.code,
      active: c.active,
      startsAt: c.startsAt,
      expiresAt: c.expiresAt,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      scope: c.scope as CouponScopeKind,
      productIds: c.productIds,
      collectionIds: c.collectionIds,
    }));
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

  /** Preview discount for an existing code or draft fields (builder). */
  async preview(body: CouponPreviewBody) {
    const min = body.minSubtotalPaise ?? 0;
    const lines = body.lines as CouponCartLine[] | undefined;

    if (body.code?.trim()) {
      try {
        const result = await this.validate(body.code.trim(), body.subtotalPaise, lines);
        return {
          ok: true as const,
          code: result.code,
          discountPaise: result.discountPaise,
          eligibleSubtotalPaise: result.eligibleSubtotalPaise,
          scope: result.scope,
          totalAfterPaise: body.subtotalPaise - result.discountPaise,
        };
      } catch (e) {
        const message =
          e instanceof BadRequestException
            ? ((e.getResponse() as { message?: string })?.message ?? 'Invalid coupon')
            : 'Invalid coupon';
        return { ok: false as const, message: String(message) };
      }
    }

    if (body.discountPaise == null && body.discountPercent == null) {
      throw new BadRequestException({
        code: 'INVALID_PREVIEW',
        message: 'Provide code or draft discount fields.',
      });
    }

    const scope = (body.scope ?? 'CART') as CouponScopeKind;
    const ids = normalizeScopeIds(scope, body.productIds, body.collectionIds);
    let eligible = body.subtotalPaise;
    if (scope !== 'CART') {
      if (lines?.length) {
        eligible = eligibleSubtotalPaise({
          scope,
          productIds: ids.productIds,
          collectionIds: ids.collectionIds,
          cartSubtotalPaise: body.subtotalPaise,
          lines,
        });
      }
      // else: admin preview treats entered subtotal as eligible amount
    }

    if (scope !== 'CART' && eligible <= 0) {
      return {
        ok: false as const,
        message:
          scope === 'PRODUCT'
            ? 'No matching products in cart.'
            : 'No matching collections in cart.',
      };
    }
    if (eligible < min) {
      return {
        ok: false as const,
        message: `Minimum order ${min / 100} INR required.`,
      };
    }
    const discountPaise = computeDiscountPaise({
      subtotalPaise: eligible,
      discountPaise: body.discountPaise,
      discountPercent: body.discountPercent,
    });
    return {
      ok: true as const,
      code: null,
      discountPaise,
      eligibleSubtotalPaise: eligible,
      scope,
      totalAfterPaise: body.subtotalPaise - discountPaise,
    };
  }

  async validate(
    code: string,
    cartSubtotalPaise: number,
    lines?: CouponCartLine[] | null,
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
        code: 'COUPON_NOT_STARTED',
        message: 'Coupon is not active yet.',
      });
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new BadRequestException({
        code: 'COUPON_EXPIRED',
        message: 'Coupon has expired.',
      });
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException({
        code: 'COUPON_EXHAUSTED',
        message: 'Coupon usage limit reached.',
      });
    }

    const scope = coupon.scope as CouponScopeKind;
    const eligible = eligibleSubtotalPaise({
      scope,
      productIds: coupon.productIds,
      collectionIds: coupon.collectionIds,
      cartSubtotalPaise,
      lines,
    });

    if (scope !== 'CART' && eligible <= 0) {
      throw new BadRequestException({
        code: 'COUPON_NOT_ELIGIBLE',
        message:
          scope === 'PRODUCT'
            ? 'Coupon does not apply to items in this cart.'
            : 'Coupon does not apply to collections in this cart.',
      });
    }

    if (eligible < coupon.minSubtotalPaise) {
      throw new BadRequestException({
        code: 'COUPON_MIN_NOT_MET',
        message: `Minimum order ${coupon.minSubtotalPaise / 100} INR required.`,
      });
    }

    const discountPaise = computeDiscountPaise({
      subtotalPaise: eligible,
      discountPaise: coupon.discountPaise,
      discountPercent: coupon.discountPercent,
    });

    return {
      code: coupon.code,
      discountPaise,
      eligibleSubtotalPaise: eligible,
      scope,
    };
  }

  async incrementUsage(code: string): Promise<void> {
    await this.prisma.coupon.update({
      where: { code },
      data: { usedCount: { increment: 1 } },
    });
  }
}
