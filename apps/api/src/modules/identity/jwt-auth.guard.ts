import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import type { RoleCode } from '@inabiya/types';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AccessPayload } from './auth.service';

export type AuthedRequest = Request & {
  user?: { id: string; email: string; roles: RoleCode[] };
  id?: string;
};

export function bearerAuthAllowed(): boolean {
  return process.env.ALLOW_BEARER_AUTH !== '0';
}

export function extractAccessToken(req: Request): string | undefined {
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.access_token;
  if (typeof cookie === 'string' && cookie.length > 0) {
    return cookie;
  }
  if (!bearerAuthAllowed()) return undefined;
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return undefined;
}

export function isBearerAuthorization(req: Request): boolean {
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.access_token;
  if (typeof cookie === 'string' && cookie.length > 0) return false;
  const header = req.headers.authorization;
  return typeof header === 'string' && header.startsWith('Bearer ') && bearerAuthAllowed();
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = extractAccessToken(req);
    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }
    req.user = await hydrateAccessUser(this.jwt, this.prisma, token);
    return true;
  }
}

export async function hydrateAccessUser(
  jwt: JwtService,
  prisma: PrismaService,
  token: string,
): Promise<{ id: string; email: string; roles: RoleCode[] }> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new UnauthorizedException({
      code: 'INVALID_TOKEN',
      message: 'Access token is invalid or expired.',
    });
  }
  let payload: AccessPayload;
  try {
    payload = jwt.verify<AccessPayload>(token, { secret });
  } catch {
    throw new UnauthorizedException({
      code: 'INVALID_TOKEN',
      message: 'Access token is invalid or expired.',
    });
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { roles: { include: { role: true } } },
  });
  if (!user?.isActive) {
    throw new UnauthorizedException({
      code: 'USER_INACTIVE',
      message: 'Account is inactive.',
    });
  }
  return {
    id: user.id,
    email: user.email,
    roles: user.roles.map((r) => r.role.code as RoleCode),
  };
}
