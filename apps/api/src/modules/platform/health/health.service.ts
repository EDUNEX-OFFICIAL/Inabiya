import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  liveness() {
    return { status: 'ok' as const };
  }

  async readiness() {
    const [database, redis] = await Promise.all([this.prisma.isHealthy(), this.redis.isHealthy()]);
    const ready = database && redis;
    return {
      status: ready ? ('ready' as const) : ('degraded' as const),
      checks: { database, redis },
    };
  }

  version() {
    return {
      name: 'inabiya-api',
      version: process.env.npm_package_version ?? '0.0.0',
      phase: 0,
    };
  }
}
