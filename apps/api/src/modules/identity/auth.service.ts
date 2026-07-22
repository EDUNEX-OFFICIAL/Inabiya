import { createHash, randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { AuthSessionResponse, AuthUser, RoleCode } from '@inabiya/types';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotificationsQueueService } from '../../infrastructure/notifications/notifications-queue.service';
import { AuditService } from '../audit/audit.service';

const ACCESS_TTL_SEC = 60 * 15; // 15m
const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7d
const RESET_TTL_MS = 1000 * 60 * 60; // 1h
const BCRYPT_ROUNDS = 10;

export interface AccessPayload {
  sub: string;
  email: string;
  roles: RoleCode[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsQueueService,
  ) {}

  async register(input: {
    email: string;
    password: string;
    displayName?: string;
    requestId?: string;
  }): Promise<AuthSessionResponse> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_TAKEN',
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const customerRole = await this.prisma.role.findUniqueOrThrow({
      where: { code: 'CUSTOMER' },
    });

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: input.displayName?.trim() || null,
        roles: { create: [{ roleId: customerRole.id }] },
      },
      include: { roles: { include: { role: true } } },
    });

    await this.audit.write({
      actorId: user.id,
      action: 'auth.register',
      resource: 'user',
      resourceId: user.id,
      requestId: input.requestId,
    });

    return this.issueSession(user, input.requestId);
  }

  async login(input: {
    email: string;
    password: string;
    requestId?: string;
  }): Promise<AuthSessionResponse> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });

    if (!user?.passwordHash || !user.isActive) {
      await this.audit.write({
        action: 'auth.login.failure',
        resource: 'user',
        metadata: { email },
        requestId: input.requestId,
      });
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      await this.audit.write({
        actorId: user.id,
        action: 'auth.login.failure',
        resource: 'user',
        resourceId: user.id,
        requestId: input.requestId,
      });
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    await this.audit.write({
      actorId: user.id,
      action: 'auth.login.success',
      resource: 'user',
      resourceId: user.id,
      requestId: input.requestId,
    });

    return this.issueSession(user, input.requestId);
  }

  async refresh(rawRefreshToken: string): Promise<AuthSessionResponse> {
    const tokenHash = hashToken(rawRefreshToken);
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: { include: { roles: { include: { role: true } } } },
      },
    });

    if (!row || row.revokedAt || row.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH',
        message: 'Refresh token is invalid or expired.',
      });
    }

    if (!row.user.isActive) {
      throw new UnauthorizedException({
        code: 'USER_INACTIVE',
        message: 'Account is inactive.',
      });
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });

    return this.issueSession(row.user);
  }

  async logout(rawRefreshToken: string | undefined, userId?: string): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else if (userId) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  /** Revoke every refresh token for the user (all devices). */
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated.',
      });
    }
    return toAuthUser(user);
  }

  async updateProfile(userId: string, displayName: string): Promise<AuthUser> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { displayName },
    });
    return this.me(userId);
  }

  /**
   * Always returns the same message (no email enumeration).
   * Enqueues reset email stub when an active password user exists.
   */
  async requestPasswordReset(input: {
    email: string;
    requestId?: string;
  }): Promise<{ ok: true; message: string }> {
    const email = input.email.trim().toLowerCase();
    const generic = {
      ok: true as const,
      message: 'If an account exists for that email, a reset link will be sent.',
    };

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash || !user.isActive) {
      await this.audit.write({
        action: 'auth.password_reset.request',
        resource: 'user',
        metadata: { email, found: false },
        requestId: input.requestId,
      });
      return generic;
    }

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + RESET_TTL_MS);
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt,
      },
    });

    const appUrl = (process.env.APP_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    await this.notifications.enqueuePasswordReset({
      userId: user.id,
      userEmail: user.email,
      resetUrl,
      expiresAt: expiresAt.toISOString(),
    });

    await this.audit.write({
      actorId: user.id,
      action: 'auth.password_reset.request',
      resource: 'user',
      resourceId: user.id,
      metadata: { email },
      requestId: input.requestId,
    });

    return generic;
  }

  async resetPassword(input: {
    token: string;
    password: string;
    requestId?: string;
  }): Promise<{ ok: true }> {
    const tokenHash = hashToken(input.token);
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'This reset link is invalid or has expired.',
      });
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      });
      await tx.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      });
      await tx.passwordResetToken.updateMany({
        where: { userId: row.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await this.audit.write({
      actorId: row.userId,
      action: 'auth.password_reset.complete',
      resource: 'user',
      resourceId: row.userId,
      requestId: input.requestId,
    });

    return { ok: true };
  }

  private async issueSession(
    user: {
      id: string;
      email: string;
      displayName: string | null;
      roles: Array<{ role: { code: string } }>;
    },
    _requestId?: string,
  ): Promise<AuthSessionResponse> {
    const authUser = toAuthUser(user);
    const accessSecret = requiredEnv('JWT_ACCESS_SECRET');
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, roles: authUser.roles } satisfies AccessPayload,
      { secret: accessSecret, expiresIn: ACCESS_TTL_SEC },
    );

    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });

    return {
      user: authUser,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TTL_SEC,
      },
    };
  }
}

function toAuthUser(user: {
  id: string;
  email: string;
  displayName: string | null;
  roles: Array<{ role: { code: string } }>;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    roles: user.roles.map((r) => r.role.code as RoleCode),
  };
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.length < 16) {
    throw new Error(`${name} must be set (min 16 chars)`);
  }
  return v;
}
