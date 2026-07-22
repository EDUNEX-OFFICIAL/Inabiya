import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ReturnStatus } from '@prisma/client';
import {
  createReturnBodySchema,
  moderateReturnBodySchema,
  returnPolicyBodySchema,
  type CreateReturnBody,
  type ModerateReturnBody,
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { CommercePolicyService } from '../ops/commerce-policy.service';
import { ReturnsService } from './returns.service';

@Controller('returns')
export class ReturnsPolicyController {
  constructor(private readonly returns: ReturnsService) {}

  @Get('policy')
  policy() {
    return this.returns.getPolicy();
  }
}

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsCustomerController {
  constructor(private readonly returns: ReturnsService) {}

  @Get('me')
  mine(@CurrentUser() user: { id: string }) {
    return this.returns.listMine(user.id);
  }

  @Get('eligibility/:orderId')
  eligibility(@CurrentUser() user: { id: string }, @Param('orderId') orderId: string) {
    return this.returns.eligibility(user.id, orderId);
  }

  @Post('orders/:orderId')
  request(
    @CurrentUser() user: { id: string },
    @Param('orderId') orderId: string,
    @Body(new ZodValidationPipe(createReturnBodySchema)) body: CreateReturnBody,
    @Req() req: AuthedRequest,
  ) {
    return this.returns.request(user.id, orderId, body, String(req.id ?? ''));
  }
}

@Controller('admin/commerce')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMMERCE_ADMIN', 'SUPER_ADMIN')
export class ReturnsAdminController {
  constructor(
    private readonly returns: ReturnsService,
    private readonly policy: CommercePolicyService,
  ) {}

  @Get('returns')
  list(@Query('status') status?: string) {
    const allowed = Object.values(ReturnStatus) as string[];
    const parsed = status && allowed.includes(status) ? (status as ReturnStatus) : undefined;
    return this.returns.listAdmin(parsed);
  }

  @Patch('returns/:id')
  moderate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moderateReturnBodySchema)) body: ModerateReturnBody,
    @CurrentUser() user: { id: string },
    @Req() req: AuthedRequest,
  ) {
    return this.returns.moderate(id, body, user.id, String(req.id ?? ''));
  }

  @Get('policy/returns')
  getPolicy() {
    return this.policy.getReturnPolicy();
  }

  @Post('policy/returns')
  setPolicy(@Body(new ZodValidationPipe(returnPolicyBodySchema)) body: { windowDays: number }) {
    return this.policy.setReturnPolicy(body);
  }
}
