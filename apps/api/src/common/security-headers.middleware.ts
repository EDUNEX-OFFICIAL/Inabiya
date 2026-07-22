import { Injectable, MiddlewareConsumer, Module, NestMiddleware, NestModule } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/** Baseline security headers for API responses (Phase 9). */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    if (
      !req.path.includes('/health') &&
      !req.path.includes('/ready') &&
      !req.path.includes('/version')
    ) {
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  }
}

@Module({})
export class SecurityHeadersModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
