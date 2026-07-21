import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AccessPayload } from './auth.service';
import { extractAccessToken, type AuthedRequest } from './jwt-auth.guard';

/** Sets req.user when a valid token is present; never blocks anonymous requests. */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = extractAccessToken(req);
    if (!token) return true;

    try {
      const secret = process.env.JWT_ACCESS_SECRET;
      if (!secret) return true;
      const payload = this.jwt.verify<AccessPayload>(token, { secret });
      req.user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles ?? [],
      };
    } catch {
      /* invalid token treated as guest */
    }
    return true;
  }
}
