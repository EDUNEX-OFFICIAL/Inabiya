import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class CustomerAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.user.findMany({
      where: { roles: { some: { role: { code: 'CUSTOMER' } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
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
        addresses: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!user) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Customer not found.' });
    }
    const { orders, addresses, ...profile } = user;
    return { profile, orders, addresses };
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
      action: 'customer.status.updated',
      resource: 'user',
      resourceId: userId,
      metadata: { isActive },
      requestId,
    });
    return updated;
  }
}
