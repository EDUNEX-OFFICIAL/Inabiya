import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  upsertBrandProfileBodySchema,
  upsertCreatorProfileBodySchema,
  type UpsertBrandProfileBody,
  type UpsertCreatorProfileBody,
} from '@inabiya/validation';
import type { RoleCode } from '@inabiya/types';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { ProfilesService } from './profiles.service';

type Actor = { id: string; roles: RoleCode[] };

@Controller('creator')
export class ProfilesPublicController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get('creators')
  list(@Query('niche') niche?: string) {
    return this.profiles.listCreators(niche);
  }

  @Get('creators/:slug')
  get(@Param('slug') slug: string) {
    return this.profiles.getCreator(slug);
  }
}

@Controller('creator')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfilesAuthController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get('me/profiles')
  me(@CurrentUser() user: Actor) {
    return this.profiles.me(user);
  }

  @Post('me/creator-profile')
  @Roles('CREATOR', 'SUPER_ADMIN')
  upsertCreator(
    @CurrentUser() user: Actor,
    @Body(new ZodValidationPipe(upsertCreatorProfileBodySchema)) body: UpsertCreatorProfileBody,
    @Req() req: AuthedRequest,
  ) {
    return this.profiles.upsertCreator(user, body, String(req.id ?? ''));
  }

  @Post('me/brand-profile')
  @Roles('BRAND', 'SUPER_ADMIN')
  upsertBrand(
    @CurrentUser() user: Actor,
    @Body(new ZodValidationPipe(upsertBrandProfileBodySchema)) body: UpsertBrandProfileBody,
    @Req() req: AuthedRequest,
  ) {
    return this.profiles.upsertBrand(user, body, String(req.id ?? ''));
  }
}
