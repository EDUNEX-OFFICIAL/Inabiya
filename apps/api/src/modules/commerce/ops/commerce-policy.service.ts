import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

const RETURN_WINDOW_KEY = 'policy.return_window_days';
const LOW_STOCK_KEY = 'policy.low_stock_threshold';
const SHIPPING_COPY_KEY = 'policy.shipping_display_copy';

export const DEFAULT_RETURN_WINDOW_DAYS = 14;
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;
export const DEFAULT_SHIPPING_DISPLAY_COPY =
  'Standard 3–5 days · Express 1–2 days. Free standard shipping on select orders.';

export type ReturnPolicy = {
  windowDays: number;
};

export type CommercePolicy = {
  returnWindowDays: number;
  lowStockThreshold: number;
  shippingDisplayCopy: string;
};

function asPositiveInt(raw: unknown, fallback: number, min: number, max: number): number {
  const n =
    typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  const v = Math.floor(n);
  if (v < min || v > max) return fallback;
  return v;
}

function asString(raw: unknown, fallback: string): string {
  return typeof raw === 'string' && raw.trim() ? raw.trim() : fallback;
}

@Injectable()
export class CommercePolicyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getReturnPolicy(): Promise<ReturnPolicy> {
    const policy = await this.getPolicy();
    return { windowDays: policy.returnWindowDays };
  }

  async getPolicy(): Promise<CommercePolicy> {
    const rows = await this.prisma.commerceSetting.findMany({
      where: {
        key: { in: [RETURN_WINDOW_KEY, LOW_STOCK_KEY, SHIPPING_COPY_KEY] },
      },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      returnWindowDays: asPositiveInt(
        map.get(RETURN_WINDOW_KEY),
        DEFAULT_RETURN_WINDOW_DAYS,
        1,
        365,
      ),
      lowStockThreshold: asPositiveInt(
        map.get(LOW_STOCK_KEY),
        DEFAULT_LOW_STOCK_THRESHOLD,
        0,
        1000,
      ),
      shippingDisplayCopy: asString(
        map.get(SHIPPING_COPY_KEY),
        DEFAULT_SHIPPING_DISPLAY_COPY,
      ),
    };
  }

  async getLowStockThreshold(): Promise<number> {
    const p = await this.getPolicy();
    return p.lowStockThreshold;
  }

  async setReturnPolicy(
    input: { windowDays: number },
    actorId?: string,
    requestId?: string,
  ): Promise<ReturnPolicy> {
    const updated = await this.setPolicy(
      { returnWindowDays: input.windowDays },
      actorId,
      requestId,
    );
    return { windowDays: updated.returnWindowDays };
  }

  async setPolicy(
    input: {
      returnWindowDays?: number;
      lowStockThreshold?: number;
      shippingDisplayCopy?: string;
    },
    actorId?: string,
    requestId?: string,
  ): Promise<CommercePolicy> {
    if (
      input.returnWindowDays == null &&
      input.lowStockThreshold == null &&
      input.shippingDisplayCopy == null
    ) {
      throw new BadRequestException({
        code: 'EMPTY_POLICY',
        message: 'Provide at least one policy field to update.',
      });
    }

    const before = await this.getPolicy();
    const next: CommercePolicy = { ...before };

    if (input.returnWindowDays != null) {
      const windowDays = Math.floor(input.returnWindowDays);
      if (!Number.isFinite(windowDays) || windowDays < 1 || windowDays > 365) {
        throw new BadRequestException({
          code: 'INVALID_RETURN_WINDOW',
          message: 'Return window must be between 1 and 365 days.',
        });
      }
      next.returnWindowDays = windowDays;
      await this.prisma.commerceSetting.upsert({
        where: { key: RETURN_WINDOW_KEY },
        create: { key: RETURN_WINDOW_KEY, value: windowDays },
        update: { value: windowDays },
      });
    }

    if (input.lowStockThreshold != null) {
      const threshold = Math.floor(input.lowStockThreshold);
      if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1000) {
        throw new BadRequestException({
          code: 'INVALID_LOW_STOCK',
          message: 'Low-stock threshold must be between 0 and 1000.',
        });
      }
      next.lowStockThreshold = threshold;
      await this.prisma.commerceSetting.upsert({
        where: { key: LOW_STOCK_KEY },
        create: { key: LOW_STOCK_KEY, value: threshold },
        update: { value: threshold },
      });
    }

    if (input.shippingDisplayCopy != null) {
      const copy = input.shippingDisplayCopy.trim();
      if (!copy || copy.length > 500) {
        throw new BadRequestException({
          code: 'INVALID_SHIPPING_COPY',
          message: 'Shipping display copy must be 1–500 characters.',
        });
      }
      next.shippingDisplayCopy = copy;
      await this.prisma.commerceSetting.upsert({
        where: { key: SHIPPING_COPY_KEY },
        create: { key: SHIPPING_COPY_KEY, value: copy },
        update: { value: copy },
      });
    }

    await this.audit.write({
      actorId: actorId ?? null,
      action: 'policy.updated',
      resource: 'commerce_settings',
      metadata: { before, after: next },
      requestId,
    });

    return next;
  }
}
