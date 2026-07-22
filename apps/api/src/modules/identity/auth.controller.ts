import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import {
  loginBodySchema,
  logoutBodySchema,
  forgotPasswordBodySchema,
  refreshBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
  updateProfileBodySchema,
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthRateLimitGuard } from '../../common/guards/rate-limit.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard, type AuthedRequest } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

const COOKIE_ACCESS = 'access_token';
const COOKIE_REFRESH = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @UseGuards(AuthRateLimitGuard)
  async register(
    @Body(new ZodValidationPipe(registerBodySchema))
    body: { email: string; password: string; displayName?: string },
    @Req() req: AuthedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.register({
      ...body,
      requestId: String(req.id ?? ''),
    });
    setAuthCookies(res, session.tokens.accessToken, session.tokens.refreshToken);
    return session;
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(AuthRateLimitGuard)
  async login(
    @Body(new ZodValidationPipe(loginBodySchema))
    body: { email: string; password: string },
    @Req() req: AuthedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.login({
      ...body,
      requestId: String(req.id ?? ''),
    });
    setAuthCookies(res, session.tokens.accessToken, session.tokens.refreshToken);
    return session;
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(AuthRateLimitGuard)
  async refresh(
    @Body(new ZodValidationPipe(refreshBodySchema))
    body: { refreshToken?: string },
    @Req() req: AuthedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw =
      body.refreshToken ??
      (req as AuthedRequest & { cookies?: Record<string, string> }).cookies?.[COOKIE_REFRESH];
    if (!raw) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token required.',
          requestId: String(req.id ?? 'unknown'),
        },
      });
    }
    const session = await this.auth.refresh(raw);
    setAuthCookies(res, session.tokens.accessToken, session.tokens.refreshToken);
    return session;
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Body(new ZodValidationPipe(logoutBodySchema))
    body: { refreshToken?: string },
    @Req() req: AuthedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw =
      body.refreshToken ??
      (req as AuthedRequest & { cookies?: Record<string, string> }).cookies?.[COOKIE_REFRESH];
    await this.auth.logout(raw);
    clearAuthCookies(res);
    return { ok: true };
  }

  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user: { id: string }, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(user.id);
    clearAuthCookies(res);
    return { ok: true };
  }

  @Post('forgot-password')
  @HttpCode(200)
  @UseGuards(AuthRateLimitGuard)
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordBodySchema))
    body: { email: string },
    @Req() req: AuthedRequest,
  ) {
    return this.auth.requestPasswordReset({
      email: body.email,
      requestId: String(req.id ?? ''),
    });
  }

  @Post('reset-password')
  @HttpCode(200)
  @UseGuards(AuthRateLimitGuard)
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordBodySchema))
    body: { token: string; password: string },
    @Req() req: AuthedRequest,
  ) {
    return this.auth.resetPassword({
      token: body.token,
      password: body.password,
      requestId: String(req.id ?? ''),
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { id: string }) {
    return this.auth.me(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(updateProfileBodySchema))
    body: { displayName: string },
  ) {
    return this.auth.updateProfile(user.id, body.displayName);
  }

  /** Easy role-gate smoke endpoint for Phase 1 testing. */
  @Get('admin-ping')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN')
  adminPing(@CurrentUser() user: { id: string; email: string; roles: string[] }) {
    return { ok: true, user };
  }
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  // Prefer COOKIE_SECURE=true behind HTTPS; default off so loopback http testing works.
  const secure = process.env.COOKIE_SECURE === 'true';
  const common = {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
  };
  res.cookie(COOKIE_ACCESS, accessToken, { ...common, maxAge: 1000 * 60 * 15 });
  res.cookie(COOKIE_REFRESH, refreshToken, {
    ...common,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie(COOKIE_ACCESS, { path: '/' });
  res.clearCookie(COOKIE_REFRESH, { path: '/' });
}
