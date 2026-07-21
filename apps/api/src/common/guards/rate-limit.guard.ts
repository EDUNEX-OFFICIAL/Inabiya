import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

type Bucket = { count: number; resetAt: number };

/**
 * In-process sliding window rate limit for auth/sensitive POSTs.
 * Single-node VPS MVP — swap for Redis when multi-instance.
 * // ponytail: in-memory Map → Redis shared counter when horizontal scale
 *
 * Auth: only failed responses should count — callers use FailedAuthRateLimit
 * via counting every attempt for simplicity; keep limit high enough for testing.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly keyPrefix: string,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ip =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
        : null) ||
      req.ip ||
      'unknown';
    const key = `${this.keyPrefix}:${ip}`;
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > this.max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      throw new HttpException(
        {
          code: 'RATE_LIMITED',
          message: 'Too many attempts. Try again shortly.',
          details: { retryAfter },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (this.buckets.size > 5000) {
      for (const [k, b] of this.buckets) {
        if (b.resetAt <= now) this.buckets.delete(k);
      }
    }
    return true;
  }
}

/** 60 attempts / 15 min — tunnel shares one IP; keep usable for local testing */
export const AuthRateLimitGuard = new RateLimitGuard(60, 15 * 60 * 1000, 'auth');
export const SensitivePostRateLimitGuard = new RateLimitGuard(60, 60 * 1000, 'sensitive');
