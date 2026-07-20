import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;

  constructor(@InjectPinoLogger(RedisService.name) private readonly logger: PinoLogger) {}

  onModuleInit(): void {
    const url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6381';
    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    this.client.on('connect', () => this.logger.info('Redis connected'));
    this.client.on('error', (err) => this.logger.warn({ err }, 'Redis error'));
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.client) return false;
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}
