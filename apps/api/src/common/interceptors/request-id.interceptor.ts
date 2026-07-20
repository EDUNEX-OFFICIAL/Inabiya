import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';

/**
 * Ensures x-request-id is present on the response (pino-http also sets it).
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { id?: string }>();
    const res = http.getResponse<Response>();
    const id = String(req.id ?? req.headers['x-request-id'] ?? '');
    if (id) {
      res.setHeader('x-request-id', id);
    }
    return next.handle();
  }
}
