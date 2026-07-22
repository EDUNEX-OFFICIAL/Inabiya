import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CampaignPaymentStatus,
  CampaignStatus,
  DeliverableStatus,
  ProposalStatus,
} from '@prisma/client';
import type {
  CampaignMessageBody,
  CampaignRatingBody,
  CreateCampaignBody,
  ReviewDeliverableBody,
  SubmitDeliverableBody,
  SubmitProposalBody,
} from '@inabiya/validation';
import type { RoleCode } from '@inabiya/types';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

type Actor = { id: string; roles: RoleCode[] };

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(actor: Actor, body: CreateCampaignBody, requestId?: string) {
    const brand = await this.requireBrand(actor.id);
    const slug = body.slug ?? `${slugify(body.title)}-${Date.now().toString(36)}`;
    const campaign = await this.prisma.campaign.create({
      data: {
        brandId: brand.id,
        title: body.title,
        slug,
        brief: body.brief,
        budgetPaise: body.budgetPaise,
        status: CampaignStatus.DRAFT,
      },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'campaign.created',
      resource: 'campaign',
      resourceId: campaign.id,
      requestId,
    });
    return campaign;
  }

  async publish(actor: Actor, id: string, requestId?: string) {
    const campaign = await this.getOwnedCampaign(actor, id);
    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.CLOSED) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Only DRAFT (or re-open from CLOSED) can publish to OPEN.',
      });
    }
    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.OPEN, publishedAt: new Date() },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'campaign.published',
      resource: 'campaign',
      resourceId: id,
      requestId,
    });
    return updated;
  }

  async close(actor: Actor, id: string, requestId?: string) {
    const campaign = await this.getOwnedCampaign(actor, id);
    if (campaign.status !== CampaignStatus.OPEN && campaign.status !== CampaignStatus.REVIEWING) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Only OPEN/REVIEWING campaigns can be closed.',
      });
    }
    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.CLOSED },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'campaign.closed',
      resource: 'campaign',
      resourceId: id,
      requestId,
    });
    return updated;
  }

  marketplace() {
    return this.prisma.campaign.findMany({
      where: { status: { in: [CampaignStatus.OPEN, CampaignStatus.REVIEWING] } },
      orderBy: { publishedAt: 'desc' },
      take: 50,
      include: {
        brand: { select: { slug: true, companyName: true } },
        _count: { select: { proposals: true } },
      },
    });
  }

  async getPublic(slug: string) {
    const c = await this.prisma.campaign.findUnique({
      where: { slug },
      include: {
        brand: { select: { slug: true, companyName: true, bio: true } },
        _count: { select: { proposals: true } },
      },
    });
    if (!c || c.status === CampaignStatus.DRAFT) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Campaign not found.' });
    }
    return c;
  }

  async mineBrand(actor: Actor) {
    const brand = await this.requireBrand(actor.id);
    return this.prisma.campaign.findMany({
      where: { brandId: brand.id },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { proposals: true } } },
    });
  }

  async brandAnalytics(actor: Actor) {
    const brand = await this.requireBrand(actor.id);
    const campaigns = await this.prisma.campaign.findMany({
      where: { brandId: brand.id },
      include: {
        _count: { select: { proposals: true } },
        payment: true,
        proposals: { select: { bidPaise: true, status: true } },
      },
    });
    const byStatus: Record<string, number> = {};
    let proposalCount = 0;
    let bidSum = 0;
    let bidN = 0;
    let paymentsPending = 0;
    let paymentsReleased = 0;
    let releasedPaise = 0;
    for (const c of campaigns) {
      byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
      proposalCount += c._count.proposals;
      for (const p of c.proposals) {
        bidSum += p.bidPaise;
        bidN += 1;
      }
      if (c.payment?.status === CampaignPaymentStatus.PENDING) paymentsPending += 1;
      if (c.payment?.status === CampaignPaymentStatus.RELEASED) {
        paymentsReleased += 1;
        releasedPaise += c.payment.amountPaise;
      }
    }
    return {
      campaignCount: campaigns.length,
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      proposalCount,
      avgBidPaise: bidN ? Math.round(bidSum / bidN) : null,
      paymentsPending,
      paymentsReleased,
      releasedPaise,
      openBudgetPaise: campaigns
        .filter((c) => c.status === CampaignStatus.OPEN || c.status === CampaignStatus.REVIEWING)
        .reduce((s, c) => s + c.budgetPaise, 0),
    };
  }

  async mineCreator(actor: Actor) {
    const creator = await this.requireCreator(actor.id);
    return this.prisma.proposal.findMany({
      where: { creatorId: creator.id },
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: {
          select: { id: true, title: true, slug: true, status: true, budgetPaise: true },
        },
      },
    });
  }

  async detail(actor: Actor, id: string) {
    const c = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        brand: true,
        proposals: {
          include: {
            creator: { select: { id: true, slug: true, displayName: true, userId: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
          include: { sender: { select: { id: true, displayName: true, email: true } } },
        },
        deliverables: { orderBy: { createdAt: 'desc' } },
        payment: true,
        ratings: true,
        winnerProposal: { include: { creator: true } },
      },
    });
    if (!c) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Campaign not found.' });
    await this.assertCanView(actor, c);
    return c;
  }

  async submitProposal(
    actor: Actor,
    campaignId: string,
    body: SubmitProposalBody,
    requestId?: string,
  ) {
    const creator = await this.requireCreator(actor.id);
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign)
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Campaign not found.' });
    if (campaign.status !== CampaignStatus.OPEN && campaign.status !== CampaignStatus.REVIEWING) {
      throw new ConflictException({
        code: 'CAMPAIGN_CLOSED',
        message: 'Closed/awarded campaigns reject new proposals.',
      });
    }
    try {
      const proposal = await this.prisma.$transaction(async (tx) => {
        const p = await tx.proposal.create({
          data: {
            campaignId,
            creatorId: creator.id,
            pitch: body.pitch,
            bidPaise: body.bidPaise,
            status: ProposalStatus.SUBMITTED,
          },
        });
        if (campaign.status === CampaignStatus.OPEN) {
          await tx.campaign.update({
            where: { id: campaignId },
            data: { status: CampaignStatus.REVIEWING },
          });
        }
        return p;
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'proposal.submitted',
        resource: 'proposal',
        resourceId: proposal.id,
        requestId,
      });
      return proposal;
    } catch (e: unknown) {
      if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException({
          code: 'ALREADY_PROPOSED',
          message: 'You already submitted a proposal for this campaign.',
        });
      }
      throw e;
    }
  }

  async award(actor: Actor, campaignId: string, proposalId: string, requestId?: string) {
    const campaign = await this.getOwnedCampaign(actor, campaignId);
    if (campaign.status !== CampaignStatus.OPEN && campaign.status !== CampaignStatus.REVIEWING) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Can only award from OPEN/REVIEWING.',
      });
    }
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, campaignId },
    });
    if (!proposal) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Proposal not found.' });
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.proposal.updateMany({
        where: { campaignId, id: { not: proposalId } },
        data: { status: ProposalStatus.REJECTED },
      });
      await tx.proposal.update({
        where: { id: proposalId },
        data: { status: ProposalStatus.AWARDED },
      });
      return tx.campaign.update({
        where: { id: campaignId },
        data: {
          status: CampaignStatus.AWARDED,
          winnerProposalId: proposalId,
        },
      });
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'campaign.awarded',
      resource: 'campaign',
      resourceId: campaignId,
      metadata: { proposalId },
      requestId,
    });
    return updated;
  }

  async startDelivery(actor: Actor, campaignId: string, requestId?: string) {
    const campaign = await this.getOwnedCampaign(actor, campaignId);
    if (campaign.status !== CampaignStatus.AWARDED) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Delivery starts from AWARDED.',
      });
    }
    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.IN_DELIVERY },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'campaign.in_delivery',
      resource: 'campaign',
      resourceId: campaignId,
      requestId,
    });
    return updated;
  }

  async postMessage(
    actor: Actor,
    campaignId: string,
    body: CampaignMessageBody,
    requestId?: string,
  ) {
    const c = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        brand: true,
        winnerProposal: { include: { creator: true } },
        proposals: { include: { creator: true } },
      },
    });
    if (!c) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Campaign not found.' });
    await this.assertCanView(actor, c);
    const msg = await this.prisma.campaignMessage.create({
      data: { campaignId, senderId: actor.id, body: body.body },
      include: { sender: { select: { id: true, displayName: true, email: true } } },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'campaign.message',
      resource: 'campaign',
      resourceId: campaignId,
      requestId,
    });
    return msg;
  }

  async submitDeliverable(
    actor: Actor,
    campaignId: string,
    body: SubmitDeliverableBody,
    requestId?: string,
  ) {
    const creator = await this.requireCreator(actor.id);
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { winnerProposal: true },
    });
    if (!campaign)
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Campaign not found.' });
    if (
      campaign.status !== CampaignStatus.AWARDED &&
      campaign.status !== CampaignStatus.IN_DELIVERY
    ) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Deliverables only after award.',
      });
    }
    if (!campaign.winnerProposal || campaign.winnerProposal.creatorId !== creator.id) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Only winner may submit.' });
    }
    const row = await this.prisma.$transaction(async (tx) => {
      if (campaign.status === CampaignStatus.AWARDED) {
        await tx.campaign.update({
          where: { id: campaignId },
          data: { status: CampaignStatus.IN_DELIVERY },
        });
      }
      return tx.deliverable.create({
        data: {
          campaignId,
          proposalId: campaign.winnerProposalId!,
          title: body.title,
          url: body.url,
          notes: body.notes,
          status: DeliverableStatus.SUBMITTED,
        },
      });
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'deliverable.submitted',
      resource: 'deliverable',
      resourceId: row.id,
      requestId,
    });
    return row;
  }

  async reviewDeliverable(
    actor: Actor,
    campaignId: string,
    deliverableId: string,
    body: ReviewDeliverableBody,
    requestId?: string,
  ) {
    const campaign = await this.getOwnedCampaign(actor, campaignId);
    if (campaign.status !== CampaignStatus.IN_DELIVERY) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Review only in IN_DELIVERY.',
      });
    }
    const d = await this.prisma.deliverable.findFirst({
      where: { id: deliverableId, campaignId },
    });
    if (!d) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Deliverable not found.' });

    if (body.status === 'CHANGES_REQUESTED') {
      return this.prisma.deliverable.update({
        where: { id: deliverableId },
        data: {
          status: DeliverableStatus.CHANGES_REQUESTED,
          notes: body.notes ?? d.notes,
        },
      });
    }

    const winner = campaign.winnerProposalId
      ? await this.prisma.proposal.findUnique({ where: { id: campaign.winnerProposalId } })
      : null;
    const amount = winner?.bidPaise ?? campaign.budgetPaise;

    const result = await this.prisma.$transaction(async (tx) => {
      const deliverable = await tx.deliverable.update({
        where: { id: deliverableId },
        data: { status: DeliverableStatus.APPROVED },
      });
      const completed = await tx.campaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.COMPLETED },
      });
      const payment = await tx.campaignPayment.upsert({
        where: { campaignId },
        create: {
          campaignId,
          amountPaise: amount,
          status: CampaignPaymentStatus.PENDING,
        },
        update: {},
      });
      return { deliverable, campaign: completed, payment };
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'deliverable.approved',
      resource: 'campaign',
      resourceId: campaignId,
      requestId,
    });
    return result;
  }

  async releasePayment(actor: Actor, campaignId: string, requestId?: string) {
    if (
      !actor.roles.includes('BRAND') &&
      !actor.roles.includes('FINANCE') &&
      !actor.roles.includes('SUPER_ADMIN')
    ) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Brand or finance required.' });
    }
    if (actor.roles.includes('BRAND') && !actor.roles.includes('FINANCE')) {
      await this.getOwnedCampaign(actor, campaignId);
    }
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { payment: true, deliverables: true },
    });
    if (!campaign)
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Campaign not found.' });
    if (campaign.status !== CampaignStatus.COMPLETED) {
      throw new BadRequestException({
        code: 'NOT_COMPLETED',
        message: 'Payment only after campaign completed.',
      });
    }
    const approved = campaign.deliverables.some((d) => d.status === DeliverableStatus.APPROVED);
    if (!approved) {
      throw new BadRequestException({
        code: 'DELIVERABLE_GATE',
        message: 'Approved deliverable required before release.',
      });
    }
    if (!campaign.payment) {
      throw new BadRequestException({ code: 'NO_PAYMENT', message: 'No payment record.' });
    }
    if (campaign.payment.status !== CampaignPaymentStatus.PENDING) {
      throw new BadRequestException({
        code: 'NOT_PENDING',
        message: `Payment is ${campaign.payment.status}.`,
      });
    }
    const updated = await this.prisma.campaignPayment.update({
      where: { id: campaign.payment.id },
      data: {
        status: CampaignPaymentStatus.RELEASED,
        releasedAt: new Date(),
        releasedById: actor.id,
      },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'campaign.payment.released',
      resource: 'campaign_payment',
      resourceId: updated.id,
      requestId,
    });
    return updated;
  }

  async rate(actor: Actor, campaignId: string, body: CampaignRatingBody, requestId?: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { brand: true, winnerProposal: { include: { creator: true } } },
    });
    if (!campaign || campaign.status !== CampaignStatus.COMPLETED) {
      throw new BadRequestException({
        code: 'NOT_ELIGIBLE',
        message: 'Ratings only after completion.',
      });
    }
    const isBrand = campaign.brand.userId === actor.id;
    const isWinner = campaign.winnerProposal?.creator.userId === actor.id;
    if (!isBrand && !isWinner && !actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not eligible to rate.' });
    }
    const row = await this.prisma.campaignRating.upsert({
      where: { campaignId_authorId: { campaignId, authorId: actor.id } },
      create: {
        campaignId,
        authorId: actor.id,
        score: body.score,
        comment: body.comment,
      },
      update: { score: body.score, comment: body.comment },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'campaign.rated',
      resource: 'campaign',
      resourceId: campaignId,
      requestId,
    });
    return row;
  }

  private async requireBrand(userId: string) {
    const brand = await this.prisma.brandProfile.findUnique({ where: { userId } });
    if (!brand) {
      throw new BadRequestException({
        code: 'BRAND_PROFILE_REQUIRED',
        message: 'Create a brand profile first.',
      });
    }
    return brand;
  }

  private async requireCreator(userId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!creator) {
      throw new BadRequestException({
        code: 'CREATOR_PROFILE_REQUIRED',
        message: 'Create a creator profile first.',
      });
    }
    return creator;
  }

  private async getOwnedCampaign(actor: Actor, id: string) {
    const brand = await this.requireBrand(actor.id);
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign)
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Campaign not found.' });
    if (campaign.brandId !== brand.id && !actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not your campaign.' });
    }
    return campaign;
  }

  private async assertCanView(
    actor: Actor,
    c: {
      id: string;
      brand: { userId: string };
      winnerProposal?: { creator?: { userId: string } | null } | null;
      proposals?: Array<{ creator: { userId: string } }>;
    },
  ) {
    if (actor.roles.includes('SUPER_ADMIN') || actor.roles.includes('FINANCE')) return;
    if (c.brand.userId === actor.id) return;
    if (c.winnerProposal?.creator?.userId === actor.id) return;
    if (c.proposals?.some((p) => p.creator.userId === actor.id)) return;
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: actor.id } });
    if (creator) {
      const mine = await this.prisma.proposal.findFirst({
        where: { campaignId: c.id, creatorId: creator.id },
      });
      if (mine) return;
    }
    throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Cannot view this campaign.' });
  }
}
