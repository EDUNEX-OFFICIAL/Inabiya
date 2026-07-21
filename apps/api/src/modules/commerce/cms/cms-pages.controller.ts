import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  CreateMarketingPageBody,
  UpdateMarketingPageBody,
} from '@inabiya/validation';
import {
  createMarketingPageBodySchema,
  updateMarketingPageBodySchema,
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { CmsPagesService } from './cms-pages.service';

@Controller('cms/pages')
export class CmsPagesPublicController {
  constructor(private readonly pages: CmsPagesService) {}

  @Get(':slug')
  getPublic(@Param('slug') slug: string) {
    return this.pages.getPublicBySlug(slug);
  }
}

@Controller('admin/cms/pages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMMERCE_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN')
export class CmsPagesAdminController {
  constructor(private readonly pages: CmsPagesService) {}

  @Get()
  list() {
    return this.pages.listAdmin();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createMarketingPageBodySchema))
    body: CreateMarketingPageBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.pages.create(body, user.id, String(req.id ?? ''));
  }

  @Get(':id/preview')
  preview(@Param('id') id: string) {
    return this.pages.getPreview(id);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.pages.getAdmin(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMarketingPageBodySchema))
    body: UpdateMarketingPageBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.pages.update(id, body, user.id, String(req.id ?? ''));
  }

  @Post(':id/publish')
  publish(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.pages.publish(id, user.id, String(req.id ?? ''));
  }

  @Post(':id/unpublish')
  unpublish(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.pages.unpublish(id, user.id, String(req.id ?? ''));
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.pages.remove(id, user.id, String(req.id ?? ''));
  }
}
