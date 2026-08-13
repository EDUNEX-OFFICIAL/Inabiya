import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AccessPayload } from './auth.service';
import { extractAccessToken, type AuthedRequest } from './jwt-auth.guard';

function readAccessUser(
  jwt: JwtService,
  token: string,
): { id: string; email: string; roles: AccessPayload['roles'] } | null {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return null;
  const payload = jwt.verify<AccessPayload>(token, { secret });
  return {
    id: payload.sub,
    email: payload.email,
    roles: payload.roles ?? [],
  };
}

/** Sets req.user when a valid token is present; never blocks anonymous requests. */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = extractAccessToken(req);
    if (!token) return true;

    try {
      const user = readAccessUser(this.jwt, token);
      if (user) req.user = user;
    } catch {
      /* invalid token treated as guest */
    }
    return true;
  }
}

/**
 * Missing token = guest. Present but invalid/expired = 401 so the client can refresh
 * instead of silently opening a second (guest) gift box.
 */
@Injectable()
export class OptionalJwtRefreshGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = extractAccessToken(req);
    if (!token) return true;

    try {
      const user = readAccessUser(this.jwt, token);
      if (user) req.user = user;
      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Access token is invalid or expired.',
      });
    }
  }
}
