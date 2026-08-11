import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CustomerCommunicationChannel,
  CustomerCommunicationStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import type { AdminCustomersQuery } from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { customerSegments } from './customer-segments';
import { normalizeCommunicationTemplateKey } from './customer-communication';
import {
  adminCustomerKeysetAfter,
  decodeAdminCustomerCursor,
  encodeAdminCustomerCursor,
} from './admin-customers-cursor';

const LTV_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

@Injectable()
export class CustomerAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: AdminCustomersQuery = { limit: 25 }) {
    const limit = query.limit ?? 25;
    const andParts: Prisma.UserWhereInput[] = [
      { roles: { some: { role: { code: 'CUSTOMER' } } } },
    ];

    if (query.status === 'active') andParts.push({ isActive: true });
    if (query.status === 'suspended') andParts.push({ isActive: false });

    if (query.q?.trim()) {
      const term = query.q.trim();
      andParts.push({
        OR: [
          { email: { contains: term, mode: 'insensitive' } },
          { displayName: { contains: term, mode: 'insensitive' } },
          { addresses: { some: { phone: { contains: term } } } },
          { orders: { some: { orderNumber: { contains: term, mode: 'insensitive' } } } },
        ],
      });
    }

    if (query.cursor) {
      try {
        andParts.push(
          adminCustomerKeysetAfter(decodeAdminCustomerCursor(query.cursor)) as Prisma.UserWhereInput,
        );
      } catch {
        throw new BadRequestException({
          code: 'INVALID_CURSOR',
          message: 'Invalid pagination cursor.',
        });
      }
    }

    const users = await this.prisma.user.findMany({
      where: { AND: andParts },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select: {
        id: true,
        email: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          where: { status: { in: LTV_STATUSES } },
          select: { totalPaise: true },
        },
        addresses: {
          where: { isDefault: true },
          take: 1,
          select: { phone: true },
        },
      },
    });

    const hasMore = users.length > limit;
    const page = hasMore ? users.slice(0, limit) : users;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeAdminCustomerCursor({ createdAt: last.createdAt, id: last.id })
        : null;

    const items = page.map((u) => {
      const ltvPaise = u.orders.reduce((s, o) => s + o.totalPaise, 0);
      const orderCount = u._count.orders;
      return {
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        isActive: u.isActive,
        createdAt: u.createdAt,
        orderCount,
        ltvPaise,
        phone: u.addresses[0]?.phone ?? null,
        segments: customerSegments({ isActive: u.isActive, orderCount, ltvPaise }),
      };
    });

    return { items, nextCursor, limit };
  }

  async get(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        roles: { some: { role: { code: 'CUSTOMER' } } },
      },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalPaise: true,
            createdAt: true,
          },
        },
        addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
      },
    });
    if (!user) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Customer not found.' });
    }

    const [ltvAgg, notes, inquiries, communications] = await Promise.all([
      this.prisma.order.aggregate({
        where: { userId, status: { in: LTV_STATUSES } },
        _sum: { totalPaise: true },
        _count: true,
      }),
      this.prisma.orderNote.findMany({
        where: { order: { userId } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          author: { select: { email: true } },
          order: { select: { id: true, orderNumber: true } },
        },
      }),
      this.prisma.giftingInquiry.findMany({
        where: { email: { equals: user.email, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          status: true,
          message: true,
          createdAt: true,
        },
      }),
      this.prisma.customerCommunicationLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { actor: { select: { email: true } } },
      }),
    ]);

    const ltvPaise = ltvAgg._sum.totalPaise ?? 0;
    const paidOrderCount = ltvAgg._count;
    const orderCount = await this.prisma.order.count({ where: { userId } });
    const { orders, addresses, ...profile } = user;

    return {
      profile: {
        id: profile.id,
        email: profile.email,
        displayName: profile.displayName,
        isActive: profile.isActive,
        createdAt: profile.createdAt,
      },
      orderCount,
      ltvPaise,
      segments: customerSegments({
        isActive: profile.isActive,
        orderCount: paidOrderCount,
        ltvPaise,
      }),
      orders,
      addresses: addresses.map((a) => ({
        id: a.id,
        label: a.label,
        fullName: a.fullName,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        state: a.state,
        postalCode: a.postalCode,
        country: a.country,
        isDefault: a.isDefault,
      })),
      notes: notes.map((n) => ({
        id: n.id,
        body: n.body,
        createdAt: n.createdAt,
        authorEmail: n.author?.email ?? null,
        orderId: n.order.id,
        orderNumber: n.order.orderNumber,
      })),
      inquiries,
      communications: communications.map((c) => ({
        id: c.id,
        channel: c.channel,
        templateKey: c.templateKey,
        subject: c.subject,
        status: c.status,
        actorEmail: c.actor?.email ?? null,
        createdAt: c.createdAt,
      })),
    };
  }

  async addCommunication(
    userId: string,
    input: {
      channel: 'EMAIL' | 'SMS' | 'INTERNAL' | 'SYSTEM';
      templateKey: string;
      subject?: string;
      status?: 'LOGGED' | 'SKIPPED';
    },
    actorId: string,
    requestId?: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        roles: { some: { role: { code: 'CUSTOMER' } } },
      },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Customer not found.' });
    }

    const templateKey = normalizeCommunicationTemplateKey(input.templateKey);
    const row = await this.prisma.customerCommunicationLog.create({
      data: {
        userId,
        channel: input.channel as CustomerCommunicationChannel,
        templateKey,
        subject: input.subject?.trim() || null,
        status: (input.status ?? 'LOGGED') as CustomerCommunicationStatus,
        actorId,
      },
      include: { actor: { select: { email: true } } },
    });

    await this.audit.write({
      actorId,
      action: 'customer.communication_logged',
      resource: 'user',
      resourceId: userId,
      metadata: {
        communicationId: row.id,
        channel: row.channel,
        templateKey: row.templateKey,
        status: row.status,
      },
      requestId,
    });

    return {
      id: row.id,
      channel: row.channel,
      templateKey: row.templateKey,
      subject: row.subject,
      status: row.status,
      actorEmail: row.actor?.email ?? null,
      createdAt: row.createdAt,
    };
  }
  async setActive(userId: string, isActive: boolean, actorId: string, requestId?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        roles: { some: { role: { code: 'CUSTOMER' } } },
      },
    });
    if (!user) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Customer not found.' });
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
    await this.audit.write({
      actorId,
      action: isActive ? 'customer.reactivated' : 'customer.suspended',
      resource: 'user',
      resourceId: userId,
      metadata: { isActive },
      requestId,
    });
    return {
      id: updated.id,
      email: updated.email,
      isActive: updated.isActive,
    };
  }

  /** Call from checkout — suspended customers cannot place orders. */
  async assertActiveForCheckout(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });
    if (!user?.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        message: 'This account is suspended. Contact support.',
      });
    }
  }
}
