import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';

export const CSRF_HEADER = 'x-requested-with';
export const CSRF_HEADER_VALUE = 'InabiyaWeb';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isBearerAuthorization(req: {
  cookies?: Record<string, string>;
  headers: { authorization?: string };
}): boolean {
  const cookie = req.cookies?.access_token;
  if (typeof cookie === 'string' && cookie.length > 0) return false;
  if (process.env.ALLOW_BEARER_AUTH === '0') return false;
  const header = req.headers.authorization;
  return typeof header === 'string' && header.startsWith('Bearer ');
}

/** Pure CSRF gate — missing header on cookie POSTs is forbidden. */
export function csrfHeaderOk(input: {
  method: string;
  path: string;
  headerValue?: string;
  bearerAuth: boolean;
}): boolean {
  const method = (input.method ?? 'GET').toUpperCase();
  if (SAFE.has(method)) return true;
  if (input.path.includes('/webhooks/')) return true;
  if (input.bearerAuth) return true;
  return input.headerValue === CSRF_HEADER_VALUE;
}

/** Cookie-session CSRF: browsers cannot set this header on simple cross-site form POSTs. */
@Injectable()
export class CsrfHeaderInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const header = req.headers[CSRF_HEADER];
    const value = Array.isArray(header) ? header[0] : header;
    const ok = csrfHeaderOk({
      method: req.method ?? 'GET',
      path: `${req.originalUrl ?? req.url ?? ''}`,
      headerValue: typeof value === 'string' ? value : undefined,
      bearerAuth: isBearerAuthorization(req),
    });
    if (!ok) {
      throw new ForbiddenException({
        code: 'CSRF_FORBIDDEN',
        message: 'Missing or invalid CSRF header.',
      });
    }
    return next.handle();
  }
}
