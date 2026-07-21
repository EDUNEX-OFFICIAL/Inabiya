import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class OpsDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const paidStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [paidOrders, todayOrders, failedPayments, lowStockRows, pendingFulfillment] =
      await Promise.all([
        this.prisma.order.findMany({
          where: { status: { in: paidStatuses } },
          select: { totalPaise: true },
        }),
        this.prisma.order.findMany({
          where: {
            status: { in: paidStatuses },
            paidAt: { gte: startOfDay },
          },
          select: { totalPaise: true },
        }),
        this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
        this.prisma.inventoryItem.findMany({
          where: { onHand: { lte: LOW_STOCK_THRESHOLD } },
          include: { variant: { include: { product: true } } },
          take: 20,
        }),
        this.prisma.order.count({
          where: { status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING] } },
        }),
      ]);

    const revenuePaise = paidOrders.reduce((s, o) => s + o.totalPaise, 0);
    const todayRevenuePaise = todayOrders.reduce((s, o) => s + o.totalPaise, 0);
    const orderCount = paidOrders.length;

    return {
      kpis: {
        orderCount,
        revenuePaise,
        todayRevenuePaise,
        aovPaise: orderCount > 0 ? Math.round(revenuePaise / orderCount) : 0,
        pendingFulfillment,
      },
      alerts: {
        failedPayments,
        lowStock: lowStockRows.map((r) => ({
          sku: r.variant.sku,
          productTitle: r.variant.product.title,
          onHand: r.onHand,
          reserved: r.reserved,
          available: r.onHand - r.reserved,
        })),
      },
    };
  }

  async dailyReport(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: {
        paidAt: { gte: since },
        status: {
          in: [
            OrderStatus.PAID,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
          ],
        },
      },
      select: { paidAt: true, totalPaise: true },
    });

    const byDay = new Map<string, { orders: number; revenuePaise: number }>();
    for (const o of orders) {
      if (!o.paidAt) continue;
      const key = o.paidAt.toISOString().slice(0, 10);
      const row = byDay.get(key) ?? { orders: 0, revenuePaise: 0 };
      row.orders += 1;
      row.revenuePaise += o.totalPaise;
      byDay.set(key, row);
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
    const [orders, customers, products] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          OR: [
            { orderNumber: { contains: term, mode: 'insensitive' } },
            { user: { email: { contains: term, mode: 'insensitive' } } },
          ],
        },
        take: 10,
        include: { user: true },
      }),
      this.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: term, mode: 'insensitive' } },
            { displayName: { contains: term, mode: 'insensitive' } },
          ],
          roles: { some: { role: { code: 'CUSTOMER' } } },
        },
        take: 10,
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
    ]);

    return {
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        customerEmail: o.user.email,
        totalPaise: o.totalPaise,
      })),
      customers: customers.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        isActive: u.isActive,
      })),
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
      })),
    };
  }
}
