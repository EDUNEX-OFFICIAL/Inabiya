import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  UpsertBrandProfileBody,
  UpsertCreatorProfileBody,
} from '@inabiya/validation';
import type { RoleCode } from '@inabiya/types';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

type Actor = { id: string; roles: RoleCode[] };

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async upsertCreator(actor: Actor, body: UpsertCreatorProfileBody, requestId?: string) {
    this.assertRole(actor, 'CREATOR');
    const row = await this.prisma.creatorProfile.upsert({
      where: { userId: actor.id },
      create: {
        userId: actor.id,
        slug: body.slug,
        displayName: body.displayName,
        bio: body.bio,
        niches: body.niches ?? [],
        portfolioUrl: body.portfolioUrl,
      },
      update: {
        slug: body.slug,
        displayName: body.displayName,
        bio: body.bio,
        niches: body.niches ?? [],
        portfolioUrl: body.portfolioUrl,
      },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'creator.profile.upsert',
      resource: 'creator_profile',
      resourceId: row.id,
      requestId,
    });
    return row;
  }

  async upsertBrand(actor: Actor, body: UpsertBrandProfileBody, requestId?: string) {
    this.assertRole(actor, 'BRAND');
    const row = await this.prisma.brandProfile.upsert({
      where: { userId: actor.id },
      create: {
        userId: actor.id,
        slug: body.slug,
        companyName: body.companyName,
        bio: body.bio,
        websiteUrl: body.websiteUrl,
      },
      update: {
        slug: body.slug,
        companyName: body.companyName,
        bio: body.bio,
        websiteUrl: body.websiteUrl,
      },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'brand.profile.upsert',
      resource: 'brand_profile',
      resourceId: row.id,
      requestId,
    });
    return row;
  }

  me(actor: Actor) {
    return Promise.all([
      this.prisma.creatorProfile.findUnique({ where: { userId: actor.id } }),
      this.prisma.brandProfile.findUnique({ where: { userId: actor.id } }),
    ]).then(([creator, brand]) => ({ creator, brand }));
  }

  getCreator(slug: string) {
    return this.prisma.creatorProfile.findUnique({ where: { slug } }).then((c) => {
      if (!c) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Creator not found.' });
      return c;
    });
  }

  listCreators(niche?: string) {
    return this.prisma.creatorProfile.findMany({
      where: niche
        ? { niches: { has: niche.toLowerCase().trim() } }
        : undefined,
      orderBy: { displayName: 'asc' },
      take: 50,
    });
  }

  private assertRole(actor: Actor, role: RoleCode) {
    if (!actor.roles.includes(role) && !actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: `${role} role required.` });
    }
  }
}
