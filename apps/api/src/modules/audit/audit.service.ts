import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async write(input: {
    actorId?: string | null;
    action: string;
    resource?: string;
    resourceId?: string;
    metadata?: Prisma.InputJsonValue;
    requestId?: string;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        resource: input.resource ?? null,
        resourceId: input.resourceId ?? null,
        metadata: input.metadata ?? undefined,
        requestId: input.requestId ?? null,
      },
    });
  }

  async list(query: {
    q?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    actorId?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 50));
    const where: Prisma.AuditLogWhereInput = {};

    if (query.action?.trim()) {
      where.action = { contains: query.action.trim(), mode: 'insensitive' };
    }
    if (query.resource?.trim()) {
      where.resource = { contains: query.resource.trim(), mode: 'insensitive' };
    }
    if (query.resourceId?.trim()) {
      where.resourceId = query.resourceId.trim();
    }
    if (query.actorId?.trim()) {
      where.actorId = query.actorId.trim();
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) {
        const from = new Date(query.from);
        if (!Number.isNaN(from.getTime())) where.createdAt.gte = from;
      }
      if (query.to) {
        const to = new Date(query.to);
        if (!Number.isNaN(to.getTime())) where.createdAt.lte = to;
      }
    }
    if (query.q?.trim()) {
      const term = query.q.trim();
      where.OR = [
        { action: { contains: term, mode: 'insensitive' } },
        { resource: { contains: term, mode: 'insensitive' } },
        { resourceId: { contains: term, mode: 'insensitive' } },
        { actor: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { actor: { select: { id: true, email: true, displayName: true } } },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      items: rows.map((r) => ({
        id: r.id,
        action: r.action,
        resource: r.resource,
        resourceId: r.resourceId,
        metadata: r.metadata,
        requestId: r.requestId,
        createdAt: r.createdAt,
        actor: r.actor
          ? { id: r.actor.id, email: r.actor.email, displayName: r.actor.displayName }
          : null,
      })),
    };
  }
}
