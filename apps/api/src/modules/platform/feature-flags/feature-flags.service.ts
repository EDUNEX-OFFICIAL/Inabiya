import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async isEnabled(key: string): Promise<boolean> {
    const row = await this.prisma.featureFlag.findUnique({ where: { key } });
    return row?.enabled === true;
  }

  async getOne(key: string) {
    const row = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!row) {
      throw new NotFoundException({
        code: 'FEATURE_FLAG_NOT_FOUND',
        message: 'Feature flag not found.',
      });
    }
    return row;
  }

  async list() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async upsert(input: {
    key: string;
    enabled: boolean;
    description?: string | null;
    actorId: string;
    requestId?: string;
  }) {
    if (!/^[a-z][a-z0-9_.-]{1,63}$/.test(input.key)) {
      throw new BadRequestException({
        code: 'FEATURE_FLAG_KEY_INVALID',
        message: 'Flag key must be lowercase kebab/dot notation (2–64 chars).',
      });
    }
    const row = await this.prisma.featureFlag.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        enabled: input.enabled,
        description: input.description ?? null,
      },
      update: {
        enabled: input.enabled,
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    });
    await this.audit.write({
      actorId: input.actorId,
      action: 'feature_flag.upserted',
      resource: 'feature_flag',
      resourceId: row.id,
      metadata: { key: row.key, enabled: row.enabled },
      requestId: input.requestId,
    });
    return row;
  }
}
