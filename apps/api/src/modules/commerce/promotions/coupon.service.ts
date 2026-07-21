import { BadRequestException, Injectable } from '@nestjs/common';
import type { CreateCouponBody } from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export type CouponResult = {
  code: string;
  discountPaise: number;
};

@Injectable()
export class CouponService {
  constructor(private readonly prisma: PrismaService) {}

  listAdmin() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createAdmin(body: CreateCouponBody) {
    if (body.discountPaise == null && body.discountPercent == null) {
      throw new BadRequestException({
        code: 'INVALID_COUPON',
        message: 'Provide discountPaise or discountPercent.',
      });
    }
    return this.prisma.coupon.create({
      data: {
        code: body.code.toUpperCase(),
        description: body.description,
        discountPaise: body.discountPaise ?? null,
        discountPercent: body.discountPercent ?? null,
        minSubtotalPaise: body.minSubtotalPaise ?? 0,
        maxUses: body.maxUses ?? null,
        active: body.active ?? true,
      },
    });
  }

  async setActive(code: string, active: boolean) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      throw new BadRequestException({
        code: 'INVALID_COUPON',
        message: 'Coupon not found.',
      });
    }
    return this.prisma.coupon.update({
      where: { code: coupon.code },
      data: { active },
    });
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

    let discountPaise = 0;
    if (coupon.discountPaise != null) {
      discountPaise = coupon.discountPaise;
    } else if (coupon.discountPercent != null) {
      discountPaise = Math.floor((subtotalPaise * coupon.discountPercent) / 100);
    }
    discountPaise = Math.min(discountPaise, subtotalPaise);

    return { code: coupon.code, discountPaise };
  }

  async incrementUsage(code: string): Promise<void> {
    await this.prisma.coupon.update({
      where: { code },
      data: { usedCount: { increment: 1 } },
    });
  }
}
