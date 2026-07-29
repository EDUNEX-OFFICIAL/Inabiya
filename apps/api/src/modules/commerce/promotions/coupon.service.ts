import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CouponPreviewBody, CreateCouponBody } from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { computeDiscountPaise, couponLifecycle } from './coupon-lifecycle';

export type CouponResult = {
  code: string;
  discountPaise: number;
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

@Injectable()
export class CouponService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listAdmin() {
    const rows = await this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    const now = new Date();
    return rows.map((c) => {
      const type =
        c.discountPercent != null ? ('PERCENT' as const) : ('FIXED_PAISE' as const);
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
        createdAt: c.createdAt,
        status: couponLifecycle(c, now),
      };
    });
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
      },
      requestId,
    });

    return created;
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
    if (body.code?.trim()) {
      try {
        const result = await this.validate(body.code.trim(), body.subtotalPaise);
        return {
          ok: true as const,
          code: result.code,
          discountPaise: result.discountPaise,
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
    if (body.subtotalPaise < min) {
      return {
        ok: false as const,
        message: `Minimum order ${min / 100} INR required.`,
      };
    }
    const discountPaise = computeDiscountPaise({
      subtotalPaise: body.subtotalPaise,
      discountPaise: body.discountPaise,
      discountPercent: body.discountPercent,
    });
    return {
      ok: true as const,
      code: null,
      discountPaise,
      totalAfterPaise: body.subtotalPaise - discountPaise,
    };
  }

  async validate(code: string, subtotalPaise: number): Promise<CouponResult> {
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
    if (subtotalPaise < coupon.minSubtotalPaise) {
      throw new BadRequestException({
        code: 'COUPON_MIN_NOT_MET',
        message: `Minimum order ${coupon.minSubtotalPaise / 100} INR required.`,
      });
    }

    const discountPaise = computeDiscountPaise({
      subtotalPaise,
      discountPaise: coupon.discountPaise,
      discountPercent: coupon.discountPercent,
    });

    return { code: coupon.code, discountPaise };
  }

  async incrementUsage(code: string): Promise<void> {
    await this.prisma.coupon.update({
      where: { code },
      data: { usedCount: { increment: 1 } },
    });
  }
}
