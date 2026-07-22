import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import {
  createReviewBodySchema,
  moderateReviewBodySchema,
  type CreateReviewBody,
  type ModerateReviewBody,
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { ReviewsService } from './reviews.service';

@Controller('catalog')
export class ReviewsPublicController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('reviews/recent')
  listRecent() {
    return this.reviews.listRecentApproved(6);
  }

  @Get('products/:slug/reviews')
  list(@Param('slug') slug: string) {
    return this.reviews.listApprovedForSlug(slug);
  }

  @Post('products/:slug/reviews')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(createReviewBodySchema)) body: CreateReviewBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.reviews.createForSlug(slug, user.id, body, String(req.id ?? ''));
  }
}

@Controller('admin/commerce/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMMERCE_ADMIN', 'SUPER_ADMIN')
export class ReviewsAdminController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(@Query('status') status?: string) {
    const allowed = Object.values(ReviewStatus) as string[];
    const parsed = status && allowed.includes(status) ? (status as ReviewStatus) : undefined;
    return this.reviews.listAdmin(parsed);
  }

  @Patch(':id')
  moderate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moderateReviewBodySchema)) body: ModerateReviewBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.reviews.moderate(id, body, user.id, String(req.id ?? ''));
  }
}
