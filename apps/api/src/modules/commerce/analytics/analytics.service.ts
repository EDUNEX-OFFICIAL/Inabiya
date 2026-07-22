import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { TrackAnalyticsBody } from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(body: TrackAnalyticsBody, userId?: string) {
    const row = await this.prisma.analyticsEvent.create({
      data: {
        name: body.name,
        sessionId: body.sessionId ?? null,
        userId: userId ?? null,
        path: body.path ?? null,
        productId: body.productId ?? null,
        orderId: body.orderId ?? null,
        metadata:
          body.metadata === undefined ? undefined : (body.metadata as Prisma.InputJsonValue),
      },
    });
    return { id: row.id, name: row.name, createdAt: row.createdAt };
  }

  async funnelSummary(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const names = ['view_plp', 'view_pdp', 'add_to_cart', 'begin_checkout', 'purchase'] as const;
    const counts = await Promise.all(
      names.map(async (name) => ({
        name,
        count: await this.prisma.analyticsEvent.count({
          where: { name, createdAt: { gte: since } },
        }),
      })),
    );
    return { days, events: counts };
  }
}
