import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import type { RoleCode } from '@inabiya/types';
import type { AccessPayload } from './auth.service';

export type AuthedRequest = Request & {
  user?: { id: string; email: string; roles: RoleCode[] };
  id?: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = extractAccessToken(req);
    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    try {
      const secret = process.env.JWT_ACCESS_SECRET;
      if (!secret) {
        throw new Error('JWT_ACCESS_SECRET missing');
      }
      const payload = this.jwt.verify<AccessPayload>(token, { secret });
      req.user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles ?? [],
      };
      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Access token is invalid or expired.',
      });
    }
  }
}

export function extractAccessToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.access_token;
  if (typeof cookie === 'string' && cookie.length > 0) {
    return cookie;
  }
  return undefined;
}
