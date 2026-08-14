import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { extractAccessToken, hydrateAccessUser, type AuthedRequest } from './jwt-auth.guard';

/** Sets req.user when a valid token is present; never blocks anonymous requests. */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = extractAccessToken(req);
    if (!token) return true;
    try {
      req.user = await hydrateAccessUser(this.jwt, this.prisma, token);
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
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = extractAccessToken(req);
    if (!token) return true;
    try {
      req.user = await hydrateAccessUser(this.jwt, this.prisma, token);
      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Access token is invalid or expired.',
      });
    }
  }
}
