import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();
    const requestId = String(req.id ?? req.headers['x-request-id'] ?? 'unknown');

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        code = HttpStatus[status] ?? 'HTTP_ERROR';
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        message = typeof obj.message === 'string' ? obj.message : message;
        if (Array.isArray(obj.message)) {
          message = 'Validation failed.';
          details = obj.message;
        }
        code = typeof obj.code === 'string' ? obj.code : (HttpStatus[status] ?? 'HTTP_ERROR');
        if (obj.details !== undefined) details = obj.details;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`[${requestId}] ${exception.message}`, exception.stack);
    }

    const envelope: ErrorEnvelope = {
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
        requestId,
      },
    };

    res.status(status).json(envelope);
  }
}
