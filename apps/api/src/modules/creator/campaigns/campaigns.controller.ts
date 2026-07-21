import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  campaignMessageBodySchema,
  campaignRatingBodySchema,
  createCampaignBodySchema,
  reviewDeliverableBodySchema,
  submitDeliverableBodySchema,
  submitProposalBodySchema,
  type CampaignMessageBody,
  type CampaignRatingBody,
  type CreateCampaignBody,
  type ReviewDeliverableBody,
  type SubmitDeliverableBody,
  type SubmitProposalBody,
} from '@inabiya/validation';
import type { RoleCode } from '@inabiya/types';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../identity/roles.decorator';
import { RolesGuard } from '../../identity/roles.guard';
import { CampaignsService } from './campaigns.service';

type Actor = { id: string; roles: RoleCode[] };

@Controller('creator')
export class CampaignsPublicController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get('marketplace')
  marketplace() {
    return this.campaigns.marketplace();
  }

  @Get('campaigns/by-slug/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.campaigns.getPublic(slug);
  }
}

@Controller('creator')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignsAuthController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get('campaigns/mine')
  @Roles('BRAND', 'SUPER_ADMIN')
  mineBrand(@CurrentUser() user: Actor) {
    return this.campaigns.mineBrand(user);
  }

  @Get('analytics/summary')
  @Roles('BRAND', 'SUPER_ADMIN')
  analytics(@CurrentUser() user: Actor) {
    return this.campaigns.brandAnalytics(user);
  }

  @Get('proposals/mine')
  @Roles('CREATOR', 'SUPER_ADMIN')
  mineCreator(@CurrentUser() user: Actor) {
    return this.campaigns.mineCreator(user);
  }

  @Post('campaigns')
  @Roles('BRAND', 'SUPER_ADMIN')
  create(
    @CurrentUser() user: Actor,
    @Body(new ZodValidationPipe(createCampaignBodySchema)) body: CreateCampaignBody,
    @Req() req: AuthedRequest,
  ) {
    return this.campaigns.create(user, body, String(req.id ?? ''));
  }

  @Get('campaigns/:id')
  detail(@CurrentUser() user: Actor, @Param('id') id: string) {
    return this.campaigns.detail(user, id);
  }

  @Post('campaigns/:id/publish')
  @Roles('BRAND', 'SUPER_ADMIN')
  publish(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @Req() req: AuthedRequest,
  ) {
    return this.campaigns.publish(user, id, String(req.id ?? ''));
  }

  @Post('campaigns/:id/close')
  @Roles('BRAND', 'SUPER_ADMIN')
  close(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @Req() req: AuthedRequest,
  ) {
    return this.campaigns.close(user, id, String(req.id ?? ''));
  }

  @Post('campaigns/:id/proposals')
  @Roles('CREATOR', 'SUPER_ADMIN')
  propose(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(submitProposalBodySchema)) body: SubmitProposalBody,
    @Req() req: AuthedRequest,
  ) {
    return this.campaigns.submitProposal(user, id, body, String(req.id ?? ''));
  }

  @Post('campaigns/:id/award/:proposalId')
  @Roles('BRAND', 'SUPER_ADMIN')
  award(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @Param('proposalId') proposalId: string,
    @Req() req: AuthedRequest,
  ) {
    return this.campaigns.award(user, id, proposalId, String(req.id ?? ''));
  }

  @Post('campaigns/:id/start-delivery')
  @Roles('BRAND', 'SUPER_ADMIN')
  startDelivery(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @Req() req: AuthedRequest,
  ) {
    return this.campaigns.startDelivery(user, id, String(req.id ?? ''));
  }

  @Post('campaigns/:id/messages')
  @Roles('BRAND', 'CREATOR', 'SUPER_ADMIN')
  message(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(campaignMessageBodySchema)) body: CampaignMessageBody,
    @Req() req: AuthedRequest,
  ) {
    return this.campaigns.postMessage(user, id, body, String(req.id ?? ''));
  }

  @Post('campaigns/:id/deliverables')
  @Roles('CREATOR', 'SUPER_ADMIN')
  deliverable(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(submitDeliverableBodySchema)) body: SubmitDeliverableBody,
    @Req() req: AuthedRequest,
  ) {
    return this.campaigns.submitDeliverable(user, id, body, String(req.id ?? ''));
  }

  @Post('campaigns/:id/deliverables/:deliverableId/review')
  @Roles('BRAND', 'SUPER_ADMIN')
  review(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @Param('deliverableId') deliverableId: string,
    @Body(new ZodValidationPipe(reviewDeliverableBodySchema)) body: ReviewDeliverableBody,
    @Req() req: AuthedRequest,
  ) {
    return this.campaigns.reviewDeliverable(
      user,
      id,
      deliverableId,
      body,
      String(req.id ?? ''),
    );
  }

  @Post('campaigns/:id/payment/release')
  @Roles('BRAND', 'FINANCE', 'SUPER_ADMIN')
  release(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @Req() req: AuthedRequest,
  ) {
    return this.campaigns.releasePayment(user, id, String(req.id ?? ''));
  }

  @Post('campaigns/:id/ratings')
  @Roles('BRAND', 'CREATOR', 'SUPER_ADMIN')
  rate(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(campaignRatingBodySchema)) body: CampaignRatingBody,
    @Req() req: AuthedRequest,
  ) {
    return this.campaigns.rate(user, id, body, String(req.id ?? ''));
  }
}
