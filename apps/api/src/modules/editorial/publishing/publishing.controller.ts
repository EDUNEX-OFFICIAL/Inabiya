import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  blogPublicListQuerySchema,
  blogSearchQuerySchema,
  createEditorialCategoryBodySchema,
  createSpecialistBodySchema,
  newsletterSignupBodySchema,
  publishArticleBodySchema,
  scheduleArticleBodySchema,
  updateEditorialCategoryBodySchema,
  updateSpecialistBodySchema,
  type BlogPublicListQuery,
  type BlogSearchQuery,
  type CreateEditorialCategoryBody,
  type CreateSpecialistBody,
  type NewsletterSignupBody,
  type PublishArticleBody,
  type ScheduleArticleBody,
  type UpdateEditorialCategoryBody,
  type UpdateSpecialistBody,
} from '@inabiya/validation';
import type { RoleCode } from '@inabiya/types';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SensitivePostRateLimitGuard } from '../../../common/guards/rate-limit.guard';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { PublishingService } from './publishing.service';

type OpsUser = { id: string; roles: RoleCode[] };

@Controller('blog')
export class PublishingPublicController {
  constructor(private readonly publishing: PublishingService) {}

  @Get()
  list(@Query(new ZodValidationPipe(blogPublicListQuerySchema)) query: BlogPublicListQuery) {
    return this.publishing.listPublic(query);
  }

  @Get('search')
  search(@Query(new ZodValidationPipe(blogSearchQuerySchema)) query: BlogSearchQuery) {
    return this.publishing.searchPublic(query.q);
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

  @Get('tags')
  listTags() {
    return this.publishing.listTags();
  }

  @Get(':slug((?!search$|categories$|tags$|specialists$|newsletter$).+)')
  getBySlug(@Param('slug') slug: string) {
    return this.publishing.getPublicBySlug(slug);
  }

  @Post('newsletter')
  @UseGuards(SensitivePostRateLimitGuard)
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

  @Post('articles/:id/unpublish')
  unpublish(@CurrentUser() user: OpsUser, @Param('id') id: string, @Req() req: AuthedRequest) {
    return this.publishing.unpublish(id, user, String(req.id ?? ''));
  }

  @Get('specialists')
  listSpecialistsAdmin() {
    return this.publishing.listSpecialists();
  }

  @Post('specialists')
  createSpecialist(
    @CurrentUser() user: OpsUser,
    @Body(new ZodValidationPipe(createSpecialistBodySchema)) body: CreateSpecialistBody,
    @Req() req: AuthedRequest,
  ) {
    return this.publishing.createSpecialist(user, body, String(req.id ?? ''));
  }

  @Patch('specialists/:id')
  updateSpecialist(
    @CurrentUser() user: OpsUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSpecialistBodySchema)) body: UpdateSpecialistBody,
    @Req() req: AuthedRequest,
  ) {
    return this.publishing.updateSpecialist(id, user, body, String(req.id ?? ''));
  }

  @Get('categories')
  listCategoriesAdmin() {
    return this.publishing.listCategories();
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

  @Patch('categories/:id')
  updateCategory(
    @CurrentUser() user: OpsUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateEditorialCategoryBodySchema))
    body: UpdateEditorialCategoryBody,
    @Req() req: AuthedRequest,
  ) {
    return this.publishing.updateCategory(id, user, body, String(req.id ?? ''));
  }

  /** Manual kick for due schedules (also runs on interval). */
  @Post('publishing/process-due')
  processDue() {
    return this.publishing.processDueSchedules();
  }
}
