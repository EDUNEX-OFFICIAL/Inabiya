import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { trackAnalyticsBodySchema, type TrackAnalyticsBody } from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../identity/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../identity/optional-jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('track')
  @UseGuards(OptionalJwtAuthGuard)
  track(
    @Body(new ZodValidationPipe(trackAnalyticsBodySchema)) body: TrackAnalyticsBody,
    @CurrentUser() user?: { id: string },
  ) {
    return this.analytics.track(body, user?.id);
  }

  @Get('funnel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMMERCE_ADMIN', 'SUPER_ADMIN')
  funnel(@Query('days') days?: string) {
    const n = days ? Number(days) : 7;
    return this.analytics.funnelSummary(Number.isFinite(n) ? Math.min(90, Math.max(1, n)) : 7);
  }
}
