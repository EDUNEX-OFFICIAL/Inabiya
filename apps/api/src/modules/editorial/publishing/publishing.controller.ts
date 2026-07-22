import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  createEditorialCategoryBodySchema,
  createSpecialistBodySchema,
  newsletterSignupBodySchema,
  publishArticleBodySchema,
  scheduleArticleBodySchema,
  type CreateEditorialCategoryBody,
  type CreateSpecialistBody,
  type NewsletterSignupBody,
  type PublishArticleBody,
  type ScheduleArticleBody,
} from '@inabiya/validation';
import type { RoleCode } from '@inabiya/types';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { PublishingService } from './publishing.service';

type OpsUser = { id: string; roles: RoleCode[] };

@Controller('articles')
export class PublishingPublicController {
  constructor(private readonly publishing: PublishingService) {}

  @Get()
  list(@Query('category') category?: string, @Query('tag') tag?: string) {
    return this.publishing.listPublic({ category, tag });
  }

  @Get('specialists')
  listSpecialists() {
    return this.publishing.listSpecialists();
  }

  @Get('specialists/:slug')
  getSpecialist(@Param('slug') slug: string) {
    return this.publishing.getSpecialist(slug);
  }

  @Get('categories')
  listCategories() {
    return this.publishing.listCategories();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.publishing.getPublicBySlug(slug);
  }

  @Post('newsletter')
  newsletter(@Body(new ZodValidationPipe(newsletterSignupBodySchema)) body: NewsletterSignupBody) {
    return this.publishing.newsletterSignup(body.email);
  }
}

@Controller('editorial')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
export class PublishingAdminController {
  constructor(private readonly publishing: PublishingService) {}

  @Post('articles/:id/schedule')
  schedule(
    @CurrentUser() user: OpsUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(scheduleArticleBodySchema)) body: ScheduleArticleBody,
    @Req() req: AuthedRequest,
  ) {
    return this.publishing.schedule(id, user, body, String(req.id ?? ''));
  }

  @Post('articles/:id/publish')
  publish(
    @CurrentUser() user: OpsUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(publishArticleBodySchema)) body: PublishArticleBody,
    @Req() req: AuthedRequest,
  ) {
    return this.publishing.publishNow(id, user, body, String(req.id ?? ''));
  }

  @Post('specialists')
  createSpecialist(
    @CurrentUser() user: OpsUser,
    @Body(new ZodValidationPipe(createSpecialistBodySchema)) body: CreateSpecialistBody,
    @Req() req: AuthedRequest,
  ) {
    return this.publishing.createSpecialist(user, body, String(req.id ?? ''));
  }

  @Post('categories')
  createCategory(
    @CurrentUser() user: OpsUser,
    @Body(new ZodValidationPipe(createEditorialCategoryBodySchema))
    body: CreateEditorialCategoryBody,
    @Req() req: AuthedRequest,
  ) {
    return this.publishing.createCategory(user, body, String(req.id ?? ''));
  }

  /** Manual kick for due schedules (also runs on interval). */
  @Post('publishing/process-due')
  processDue() {
    return this.publishing.processDueSchedules();
  }
}
