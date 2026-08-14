import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { upsertFeatureFlagBodySchema } from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../identity/current-user.decorator';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { FeatureFlagsService } from './feature-flags.service';

@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly flags: FeatureFlagsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async list() {
    return this.flags.list();
  }

  /** Evaluate: `{ enabled }` only. Missing key is disabled (no existence leak). */
  @Get(':key')
  async getOne(@Param('key') key: string) {
    const enabled = await this.flags.isEnabled(key);
    return { enabled };
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async upsert(
    @Param('key') key: string,
    @Body(new ZodValidationPipe(upsertFeatureFlagBodySchema))
    body: { enabled: boolean; description?: string | null },
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.flags.upsert({
      key,
      enabled: body.enabled,
      description: body.description,
      actorId: user.id,
      requestId: String(req.id ?? ''),
    });
  }
}
