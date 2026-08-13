import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus, ProductStatus, ReturnStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CommercePolicyService } from './commerce-policy.service';

const PAID_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

/** Matches order desk SLA: PAID/PROCESSING older than 24h. */
export const DASHBOARD_SLA_HOURS = 24;
const SPARKLINE_DAYS = 7;

export type DashboardRangeDays = 1 | 7 | 30;

function slaCutoff(hours = DASHBOARD_SLA_HOURS): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

/** paidAt ?? createdAt ≤ cutoff (same spirit as orders desk exceptions). */
function agingWhere(status: OrderStatus, cutoff: Date) {
  return {
    status,
    OR: [{ paidAt: { lte: cutoff } }, { paidAt: null, createdAt: { lte: cutoff } }],
  };
}

@Injectable()
export class OpsDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: CommercePolicyService,
    private readonly audit: AuditService,
  ) {}

  async dashboard(rangeDays: DashboardRangeDays = 7) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const rangeStart = new Date();
    if (rangeDays === 1) {
      rangeStart.setTime(startOfDay.getTime());
    } else {
      rangeStart.setDate(rangeStart.getDate() - (rangeDays - 1));
      rangeStart.setHours(0, 0, 0, 0);
    }

    const prevStart = this.rangeStart(rangeDays * 2);
    const prevEnd = new Date(rangeStart.getTime() - 1);
    const sparkStart = this.rangeStart(SPARKLINE_DAYS);
    const cutoff = slaCutoff();

    const commercePolicy = await this.policy.getPolicy();
    const lowStockThreshold = commercePolicy.lowStockThreshold;

    const [
      rangeAgg,
      prevAgg,
      todayAgg,
      sparkOrders,
      failedPayments,
      lowStockRows,
      pendingFulfillment,
      pendingShip,
      awaitingProcess,
      openReturns,
      awaitingProcessAging,
      pendingShipAging,
      recentAuditPage,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          status: { in: PAID_STATUSES },
          paidAt: { gte: rangeStart },
        },
        _sum: { totalPaise: true },
        _count: { _all: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: PAID_STATUSES },
          paidAt: { gte: prevStart, lte: prevEnd },
        },
        _sum: { totalPaise: true },
        _count: { _all: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: PAID_STATUSES },
          paidAt: { gte: startOfDay },
        },
        _sum: { totalPaise: true },
        _count: { _all: true },
      }),
      this.prisma.order.findMany({
        where: {
          status: { in: PAID_STATUSES },
          paidAt: { gte: sparkStart },
        },
        select: { paidAt: true, totalPaise: true },
      }),
      this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
      this.prisma.inventoryItem.findMany({
        where: {
          onHand: { lte: lowStockThreshold },
          variant: { product: { status: ProductStatus.PUBLISHED } },
        },
        select: {
          onHand: true,
          reserved: true,
          variant: {
            select: {
              sku: true,
              productId: true,
              product: { select: { title: true } },
            },
          },
        },
        take: 20,
        orderBy: { onHand: 'asc' },
      }),
      this.prisma.order.count({
        where: { status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING] } },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.PROCESSING } }),
      this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
      this.prisma.returnRequest.count({
        where: { status: { in: [ReturnStatus.REQUESTED, ReturnStatus.APPROVED] } },
      }),
      this.prisma.order.count({ where: agingWhere(OrderStatus.PAID, cutoff) }),
      this.prisma.order.count({ where: agingWhere(OrderStatus.PROCESSING, cutoff) }),
      this.audit.list({ page: 1, pageSize: 5 }),
    ]);

    const revenuePaise = rangeAgg._sum.totalPaise ?? 0;
    const todayRevenuePaise = todayAgg._sum.totalPaise ?? 0;
    const orderCount = rangeAgg._count._all;
    const ordersToday = todayAgg._count._all;
    const prevRevenuePaise = prevAgg._sum.totalPaise ?? 0;
    const prevOrderCount = prevAgg._count._all;

    return {
      rangeDays,
      generatedAt: new Date().toISOString(),
      kpis: {
        orderCount,
        revenuePaise,
        aovPaise: orderCount > 0 ? Math.round(revenuePaise / orderCount) : 0,
        ordersToday,
        todayRevenuePaise,
        pendingFulfillment,
        pendingShip,
        awaitingProcess,
      },
      previous: {
        orderCount: prevOrderCount,
        revenuePaise: prevRevenuePaise,
        aovPaise: prevOrderCount > 0 ? Math.round(prevRevenuePaise / prevOrderCount) : 0,
      },
      daily: this.bucketDaily(sparkOrders, SPARKLINE_DAYS, sparkStart),
      aging: {
        hours: DASHBOARD_SLA_HOURS,
        awaitingProcess: awaitingProcessAging,
        pendingShip: pendingShipAging,
        fulfillment: awaitingProcessAging + pendingShipAging,
      },
      alertPrefs: commercePolicy.dashboardAlertPrefs,
      recentAudit: recentAuditPage.items.map((r) => ({
        id: r.id,
        action: r.action,
        resource: r.resource,
        resourceId: r.resourceId,
        createdAt: r.createdAt,
        actorEmail: r.actor?.email ?? null,
      })),
      alerts: {
        failedPayments,
        openReturns,
        pendingFulfillment,
        pendingShip,
        awaitingProcess,
        lowStock: lowStockRows.map((r) => ({
          sku: r.variant.sku,
          productTitle: r.variant.product.title,
          productId: r.variant.productId,
          onHand: r.onHand,
          reserved: r.reserved,
          available: r.onHand - r.reserved,
        })),
      },
    };
  }

  async dailyReport(days = 7) {
    const rangeStart = this.rangeStart(days);

    const orders = await this.prisma.order.findMany({
      where: {
        paidAt: { gte: rangeStart },
        status: { in: PAID_STATUSES },
      },
      select: { paidAt: true, totalPaise: true },
    });

    return this.bucketDaily(orders, days, rangeStart);
  }

  /** Sales report: daily buckets + totals aligned with dashboard KPIs + previous period. */
  async salesReport(days = 7) {
    const rangeStart = this.rangeStart(days);
    const prevStart = this.rangeStart(days * 2);
    const prevEnd = new Date(rangeStart.getTime() - 1);

    const [currentOrders, prevAgg] = await Promise.all([
      this.prisma.order.findMany({
        where: { paidAt: { gte: rangeStart }, status: { in: PAID_STATUSES } },
        select: { paidAt: true, totalPaise: true },
      }),
      this.prisma.order.aggregate({
        where: {
          paidAt: { gte: prevStart, lte: prevEnd },
          status: { in: PAID_STATUSES },
        },
        _sum: { totalPaise: true },
        _count: { _all: true },
      }),
    ]);

    const daily = this.bucketDaily(currentOrders, days, rangeStart);
    const revenuePaise = currentOrders.reduce((s, o) => s + o.totalPaise, 0);
    const orderCount = currentOrders.length;
    const prevRevenuePaise = prevAgg._sum.totalPaise ?? 0;
    const prevOrderCount = prevAgg._count._all;

    return {
      days,
      rangeStart: rangeStart.toISOString(),
      generatedAt: new Date().toISOString(),
      totals: {
        orderCount,
        revenuePaise,
        aovPaise: orderCount > 0 ? Math.round(revenuePaise / orderCount) : 0,
      },
      previous: {
        orderCount: prevOrderCount,
        revenuePaise: prevRevenuePaise,
        aovPaise: prevOrderCount > 0 ? Math.round(prevRevenuePaise / prevOrderCount) : 0,
      },
      daily,
    };
  }

  async productsReport(days = 7) {
    const rangeStart = this.rangeStart(days);
    const rows = await this.prisma.$queryRaw<
      Array<{ sku: string; title: string; units: bigint; revenuePaise: bigint }>
    >`
      SELECT
        oi.sku AS sku,
        MAX(oi.title) AS title,
        SUM(oi.quantity)::bigint AS units,
        SUM(oi.line_total_paise)::bigint AS "revenuePaise"
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.paid_at >= ${rangeStart}
        AND o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
      GROUP BY oi.sku
      ORDER BY SUM(oi.line_total_paise) DESC
      LIMIT 50
    `;

    return {
      days,
      rangeStart: rangeStart.toISOString(),
      rows: rows.map((r) => ({
        sku: r.sku,
        title: r.title,
        units: Number(r.units),
        revenuePaise: Number(r.revenuePaise),
      })),
    };
  }

  async inventoryReport() {
    const lowStockThreshold = await this.policy.getLowStockThreshold();
    const [lowStock, publishedVariants, aggregates] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where: {
          onHand: { lte: lowStockThreshold },
          variant: { product: { status: ProductStatus.PUBLISHED } },
        },
        include: {
          variant: { include: { product: { select: { id: true, title: true, slug: true } } } },
        },
        orderBy: { onHand: 'asc' },
        take: 100,
      }),
      this.prisma.productVariant.count({
        where: { product: { status: ProductStatus.PUBLISHED } },
      }),
      this.prisma.inventoryItem.aggregate({
        where: { variant: { product: { status: ProductStatus.PUBLISHED } } },
        _sum: { onHand: true, reserved: true },
      }),
    ]);

    return {
      threshold: lowStockThreshold,
      summary: {
        publishedVariants,
        lowStockCount: lowStock.length,
        onHandUnits: aggregates._sum.onHand ?? 0,
        reservedUnits: aggregates._sum.reserved ?? 0,
        availableUnits: (aggregates._sum.onHand ?? 0) - (aggregates._sum.reserved ?? 0),
      },
      lowStock: lowStock.map((r) => ({
        sku: r.variant.sku,
        label: r.variant.label,
        productId: r.variant.product.id,
        productTitle: r.variant.product.title,
        onHand: r.onHand,
        reserved: r.reserved,
        available: r.onHand - r.reserved,
      })),
    };
  }

  async returnsReport(days = 7) {
    const rangeStart = this.rangeStart(days);
    const [byStatus, recent] = await Promise.all([
      this.prisma.returnRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.returnRequest.findMany({
        where: { createdAt: { gte: rangeStart } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          status: true,
          reason: true,
          createdAt: true,
          order: { select: { id: true, orderNumber: true, totalPaise: true } },
        },
      }),
    ]);

    return {
      days,
      rangeStart: rangeStart.toISOString(),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
      recent: recent.map((r) => ({
        id: r.id,
        status: r.status,
        reason: r.reason,
        createdAt: r.createdAt,
        orderId: r.order.id,
        orderNumber: r.order.orderNumber,
        orderTotalPaise: r.order.totalPaise,
      })),
    };
  }

  async couponsReport(days = 7) {
    const rangeStart = this.rangeStart(days);
    const [coupons, redeemed] = await Promise.all([
      this.prisma.coupon.findMany({
        orderBy: { usedCount: 'desc' },
        take: 100,
      }),
      this.prisma.order.groupBy({
        by: ['couponCode'],
        where: {
          paidAt: { gte: rangeStart },
          status: { in: PAID_STATUSES },
          couponCode: { not: null },
        },
        _count: { _all: true },
        _sum: { discountPaise: true, totalPaise: true },
      }),
    ]);

    const windowMap = new Map(
      redeemed
        .filter((r) => r.couponCode)
        .map((r) => [
          r.couponCode!,
          {
            orders: r._count._all,
            discountPaise: r._sum.discountPaise ?? 0,
            revenuePaise: r._sum.totalPaise ?? 0,
          },
        ]),
    );

    return {
      days,
      rangeStart: rangeStart.toISOString(),
      rows: coupons.map((c) => ({
        code: c.code,
        active: c.active,
        usedCount: c.usedCount,
        maxUses: c.maxUses,
        discountPaise: c.discountPaise,
        discountPercent: c.discountPercent,
        windowOrders: windowMap.get(c.code)?.orders ?? 0,
        windowDiscountPaise: windowMap.get(c.code)?.discountPaise ?? 0,
        windowRevenuePaise: windowMap.get(c.code)?.revenuePaise ?? 0,
      })),
    };
  }

  private rangeStart(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private bucketDaily(
    orders: Array<{ paidAt: Date | null; totalPaise: number }>,
    days: number,
    rangeStart: Date,
  ) {
    const byDay = new Map<string, { orders: number; revenuePaise: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(rangeStart);
      d.setDate(rangeStart.getDate() + i);
      byDay.set(d.toISOString().slice(0, 10), { orders: 0, revenuePaise: 0 });
    }
    for (const o of orders) {
      if (!o.paidAt) continue;
      const key = o.paidAt.toISOString().slice(0, 10);
      const row = byDay.get(key);
      if (!row) continue;
      row.orders += 1;
      row.revenuePaise += o.totalPaise;
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, row]) => ({ date, ...row }));
  }

  async statusReport() {
    const rows = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { totalPaise: true },
    });
    return rows.map((r) => ({
      status: r.status,
      orders: r._count._all,
      revenuePaise: r._sum.totalPaise ?? 0,
    }));
  }

  async search(q: string) {
    const term = q.trim();
    const digits = term.replace(/\D/g, '');
    const customerPhoneOr =
      digits.length >= 7 ? [{ addresses: { some: { phone: { contains: digits } } } } as const] : [];
    const orderPhoneOr =
      digits.length >= 7
        ? [
            {
              shippingAddress: {
                path: ['phone'],
                string_contains: digits,
              },
            } as const,
          ]
        : [];

    const [orders, customers, products, inquiries] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          OR: [
            { orderNumber: { contains: term, mode: 'insensitive' } },
            { user: { email: { contains: term, mode: 'insensitive' } } },
            ...orderPhoneOr,
          ],
        },
        take: 10,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: term, mode: 'insensitive' } },
            { displayName: { contains: term, mode: 'insensitive' } },
            ...customerPhoneOr,
          ],
          roles: { some: { role: { code: 'CUSTOMER' } } },
        },
        take: 10,
        include: {
          addresses: { where: { isDefault: true }, take: 1, select: { phone: true } },
        },
      }),
      this.prisma.product.findMany({
        where: {
          status: ProductStatus.PUBLISHED,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { slug: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      this.prisma.giftingInquiry.findMany({
        where: {
          OR: [
            { email: { contains: term, mode: 'insensitive' } },
            { fullName: { contains: term, mode: 'insensitive' } },
            ...(digits.length >= 7 ? [{ phone: { contains: digits } }] : []),
          ],
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      orders: orders.map((o) => {
        const ship = o.shippingAddress as { phone?: string } | null;
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          customerEmail: o.user.email,
          customerId: o.user.id,
          phone: typeof ship?.phone === 'string' ? ship.phone : null,
          totalPaise: o.totalPaise,
        };
      }),
      customers: customers.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        isActive: u.isActive,
        phone: u.addresses[0]?.phone ?? null,
      })),
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
      })),
      inquiries: inquiries.map((i) => ({
        id: i.id,
        type: i.type,
        email: i.email,
        fullName: i.fullName,
        phone: i.phone,
        status: i.status,
        createdAt: i.createdAt,
      })),
    };
  }
}
