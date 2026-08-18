import { Injectable, MiddlewareConsumer, Module, NestMiddleware, NestModule } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const PUBLIC_MEDIA_CONTENT =
  /\/media\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/content\/?$/;

/** Product/CMS image bytes are UUID-keyed and safe to cache; everything else stays no-store. */
export function shouldNoStore(path: string): boolean {
  if (path.includes('/health') || path.includes('/ready') || path.includes('/version')) {
    return false;
  }
  if (PUBLIC_MEDIA_CONTENT.test(path)) return false;
  return true;
}

/** Baseline security headers for API responses (Phase 9). */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    if (shouldNoStore(req.path)) {
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
