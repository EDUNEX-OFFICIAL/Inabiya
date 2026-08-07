import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

const RETURN_WINDOW_KEY = 'policy.return_window_days';
const LOW_STOCK_KEY = 'policy.low_stock_threshold';
const SHIPPING_COPY_KEY = 'policy.shipping_display_copy';
const ALERT_PREFS_KEY = 'policy.dashboard_alert_prefs';
const TRUST_CUES_KEY = 'pdp.trust_cues';

export const DEFAULT_RETURN_WINDOW_DAYS = 14;
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;
export const DEFAULT_SHIPPING_DISPLAY_COPY =
  'Standard 3–5 days · Express 1–2 days. Free standard shipping on select orders.';

export const DEFAULT_DASHBOARD_ALERT_PREFS: DashboardAlertPrefs = {
  failedPayments: true,
  awaitingProcess: true,
  pendingShip: true,
  openReturns: true,
  lowStock: true,
};

export type PdpTrustCueIcon = 'lock' | 'returns' | 'gift';

export type PdpTrustCue = {
  title: string;
  body: string;
  icon: PdpTrustCueIcon;
};

export const DEFAULT_TRUST_CUES: PdpTrustCue[] = [
  {
    title: 'Secure checkout',
    body: 'Encrypted payment — your details stay private.',
    icon: 'lock',
  },
  {
    title: '14-day returns',
    body: 'Easy returns after delivery within the window.',
    icon: 'returns',
  },
  {
    title: 'Gift-box ready',
    body: 'Many pieces are eligible for Build Your Box.',
    icon: 'gift',
  },
];

export type ReturnPolicy = {
  windowDays: number;
};

export type DashboardAlertPrefs = {
  failedPayments: boolean;
  awaitingProcess: boolean;
  pendingShip: boolean;
  openReturns: boolean;
  lowStock: boolean;
};

export type CommercePolicy = {
  returnWindowDays: number;
  lowStockThreshold: number;
  shippingDisplayCopy: string;
  dashboardAlertPrefs: DashboardAlertPrefs;
  trustCues: PdpTrustCue[];
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

function asAlertPrefs(raw: unknown): DashboardAlertPrefs {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_DASHBOARD_ALERT_PREFS };
  }
  const o = raw as Record<string, unknown>;
  return {
    failedPayments: o.failedPayments !== false,
    awaitingProcess: o.awaitingProcess !== false,
    pendingShip: o.pendingShip !== false,
    openReturns: o.openReturns !== false,
    lowStock: o.lowStock !== false,
  };
}

const TRUST_ICONS = new Set<PdpTrustCueIcon>(['lock', 'returns', 'gift']);

function asTrustCues(raw: unknown): PdpTrustCue[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_TRUST_CUES.map((c) => ({ ...c }));
  }
  const parsed: PdpTrustCue[] = [];
  for (const item of raw.slice(0, 6)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    const body = typeof o.body === 'string' ? o.body.trim() : '';
    const icon = o.icon;
    if (!title || !body || typeof icon !== 'string' || !TRUST_ICONS.has(icon as PdpTrustCueIcon)) {
      continue;
    }
    parsed.push({
      title: title.slice(0, 80),
      body: body.slice(0, 200),
      icon: icon as PdpTrustCueIcon,
    });
  }
  return parsed.length > 0 ? parsed : DEFAULT_TRUST_CUES.map((c) => ({ ...c }));
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

  async getTrustCues(): Promise<PdpTrustCue[]> {
    const policy = await this.getPolicy();
    return policy.trustCues;
  }

  async getPolicy(): Promise<CommercePolicy> {
    const rows = await this.prisma.commerceSetting.findMany({
      where: {
        key: {
          in: [
            RETURN_WINDOW_KEY,
            LOW_STOCK_KEY,
            SHIPPING_COPY_KEY,
            ALERT_PREFS_KEY,
            TRUST_CUES_KEY,
          ],
        },
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
      dashboardAlertPrefs: asAlertPrefs(map.get(ALERT_PREFS_KEY)),
      trustCues: asTrustCues(map.get(TRUST_CUES_KEY)),
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
      dashboardAlertPrefs?: DashboardAlertPrefs;
      trustCues?: PdpTrustCue[];
    },
    actorId?: string,
    requestId?: string,
  ): Promise<CommercePolicy> {
    if (
      input.returnWindowDays == null &&
      input.lowStockThreshold == null &&
      input.shippingDisplayCopy == null &&
      input.dashboardAlertPrefs == null &&
      input.trustCues == null
    ) {
      throw new BadRequestException({
        code: 'EMPTY_POLICY',
        message: 'Provide at least one policy field to update.',
      });
    }

    const before = await this.getPolicy();
    const next: CommercePolicy = {
      ...before,
      dashboardAlertPrefs: { ...before.dashboardAlertPrefs },
      trustCues: before.trustCues.map((c) => ({ ...c })),
    };

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

    if (input.dashboardAlertPrefs != null) {
      next.dashboardAlertPrefs = asAlertPrefs(input.dashboardAlertPrefs);
      await this.prisma.commerceSetting.upsert({
        where: { key: ALERT_PREFS_KEY },
        create: {
          key: ALERT_PREFS_KEY,
          value: next.dashboardAlertPrefs as unknown as Prisma.InputJsonValue,
        },
        update: {
          value: next.dashboardAlertPrefs as unknown as Prisma.InputJsonValue,
        },
      });
    }

    if (input.trustCues != null) {
      next.trustCues = asTrustCues(input.trustCues);
      await this.prisma.commerceSetting.upsert({
        where: { key: TRUST_CUES_KEY },
        create: {
          key: TRUST_CUES_KEY,
          value: next.trustCues as unknown as Prisma.InputJsonValue,
        },
        update: {
          value: next.trustCues as unknown as Prisma.InputJsonValue,
        },
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
