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
}
