import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  articleCommentBodySchema,
  articleTransitionBodySchema,
  createArticleBodySchema,
  updateArticleBodySchema,
  type ArticleCommentBody,
  type ArticleTransitionBody,
  type CreateArticleBody,
  type UpdateArticleBody,
} from '@inabiya/validation';
import type { RoleCode } from '@inabiya/types';
import { ArticleStatus } from '@prisma/client';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { ArticlesService } from './articles.service';

type EditorialUser = { id: string; roles: RoleCode[] };

@Controller('editorial')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CONTENT_ADMIN', 'WRITER', 'SEO_EDITOR', 'MEDICAL_REVIEWER', 'SUPER_ADMIN')
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get('writers')
  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  writers() {
    return this.articles.listWriters();
  }

  @Get('analytics/turnaround')
  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  turnaround() {
    return this.articles.turnaroundAnalytics();
  }

  @Get('articles')
  list(
    @CurrentUser() user: EditorialUser,
    @Query('mine') mine?: string,
    @Query('status') status?: string,
    @Query('overdue') overdue?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    const allowed = Object.values(ArticleStatus) as string[];
    const parsed = status && allowed.includes(status) ? (status as ArticleStatus) : undefined;
    let assigneeFilter: string | null | undefined;
    if (assigneeId === 'unassigned') {
      assigneeFilter = null;
    } else if (assigneeId && /^[0-9a-f-]{36}$/i.test(assigneeId)) {
      assigneeFilter = assigneeId;
    }
    return this.articles.list(user, {
      mineOnly: mine === '1' || mine === 'true',
      status: parsed,
      overdue: overdue === '1' || overdue === 'true',
      assigneeId: assigneeFilter,
    });
  }

  @Post('articles')
  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  create(
    @CurrentUser() user: EditorialUser,
    @Body(new ZodValidationPipe(createArticleBodySchema)) body: CreateArticleBody,
    @Req() req: AuthedRequest,
  ) {
    return this.articles.create(user, body, String(req.id ?? ''));
  }

  @Get('articles/:id')
  get(@CurrentUser() user: EditorialUser, @Param('id') id: string) {
    return this.articles.get(id, user);
  }

  @Get('articles/:id/preview')
  preview(@CurrentUser() user: EditorialUser, @Param('id') id: string) {
    return this.articles.preview(id, user);
  }

  @Patch('articles/:id')
  update(
    @CurrentUser() user: EditorialUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateArticleBodySchema)) body: UpdateArticleBody,
    @Req() req: AuthedRequest,
  ) {
    return this.articles.update(id, user, body, String(req.id ?? ''));
  }

  @Post('articles/:id/transition')
  transition(
    @CurrentUser() user: EditorialUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(articleTransitionBodySchema)) body: ArticleTransitionBody,
    @Req() req: AuthedRequest,
  ) {
    return this.articles.transition(id, user, body, String(req.id ?? ''));
  }

  @Post('articles/:id/comments')
  comment(
    @CurrentUser() user: EditorialUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(articleCommentBodySchema)) body: ArticleCommentBody,
    @Req() req: AuthedRequest,
  ) {
    return this.articles.addComment(id, user, body, String(req.id ?? ''));
  }

  @Post('articles/:id/return-to-draft')
  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  returnToDraft(
    @CurrentUser() user: EditorialUser,
    @Param('id') id: string,
    @Req() req: AuthedRequest,
  ) {
    return this.articles.returnToDraft(id, user, String(req.id ?? ''));
  }

  @Delete('articles/:id')
  @HttpCode(204)
  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  async remove(
    @CurrentUser() user: EditorialUser,
    @Param('id') id: string,
    @Req() req: AuthedRequest,
  ) {
    await this.articles.remove(id, user, String(req.id ?? ''));
  }
}
