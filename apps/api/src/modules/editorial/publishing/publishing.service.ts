import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleStatus, WriterPaymentStatus } from '@prisma/client';
import type {
  CreateEditorialCategoryBody,
  CreateSpecialistBody,
  PublishArticleBody,
  ScheduleArticleBody,
  UpdateEditorialCategoryBody,
  UpdateSpecialistBody,
} from '@inabiya/validation';
import type { RoleCode } from '@inabiya/types';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { readSeoSchemaExtras } from '../../../common/seo-schema-extras';
import { upsertArticleTagIds } from '../article-tags';
import { articleCanonicalPath } from '../article-canonical';
import { publishBlockReason } from '../articles/editorial-transitions';

type Actor = { id: string; roles: RoleCode[] };

const DEFAULT_WRITER_FEE_PAISE = Number(process.env.WRITER_FEE_PAISE ?? 50000);

@Injectable()
export class PublishingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async schedule(articleId: string, actor: Actor, body: ScheduleArticleBody, requestId?: string) {
    this.assertOps(actor);
    const article = await this.loadForPublish(articleId);
    this.assertPublishable(article);
    const scheduledAt = this.parseWhen(body.scheduledAt);
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException({
        code: 'INVALID_SCHEDULE',
        message: 'scheduledAt must be in the future. Use publish for immediate.',
      });
    }
    const meta = await this.resolveMeta(body);
    const updated = await this.prisma.article.update({
      where: { id: articleId },
      data: {
        status: ArticleStatus.SCHEDULED,
        scheduledAt,
        publishedAt: null,
        seoTitle: body.seoTitle ?? article.seoTitle ?? article.title,
        seoDescription: body.seoDescription ?? article.seoDescription,
        canonicalPath: articleCanonicalPath(article.slug),
        ogImageUrl: body.ogImageUrl ?? article.ogImageUrl,
        categoryId: meta.categoryId ?? article.categoryId,
        specialistId: meta.specialistId ?? article.specialistId,
        statusHistory: {
          create: {
            status: ArticleStatus.SCHEDULED,
            note: `Scheduled for ${scheduledAt.toISOString()}`,
            actorId: actor.id,
          },
        },
        ...(meta.tagIds
          ? {
              tags: {
                deleteMany: {},
                create: meta.tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'article.scheduled',
      resource: 'article',
      resourceId: articleId,
      metadata: { scheduledAt },
      requestId,
    });
    return updated;
  }

  async publishNow(
    articleId: string,
    actor: Actor,
    body: PublishArticleBody = {},
    requestId?: string,
  ) {
    this.assertOps(actor);
    const article = await this.loadForPublish(articleId);
    this.assertPublishable(article);
    const meta = await this.resolveMeta(body);
    return this.finalizePublish(articleId, actor.id, {
      seoTitle: body.seoTitle ?? article.seoTitle ?? article.title,
      seoDescription: body.seoDescription ?? article.seoDescription,
      ogImageUrl: body.ogImageUrl ?? article.ogImageUrl,
      categoryId: meta.categoryId ?? article.categoryId,
      specialistId: meta.specialistId ?? article.specialistId,
      tagIds: meta.tagIds,
      requestId,
    });
  }

  /** Take off Journal. Stays APPROVED so ops can Publish again without re-running gates. */
  async unpublish(articleId: string, actor: Actor, requestId?: string) {
    this.assertOps(actor);
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Article not found.' });
    }
    if (article.status !== ArticleStatus.PUBLISHED && article.status !== ArticleStatus.SCHEDULED) {
      throw new BadRequestException({
        code: 'NOT_PUBLIC',
        message: 'Only published or scheduled articles can be hidden.',
      });
    }
    const updated = await this.prisma.article.update({
      where: { id: articleId },
      data: {
        status: ArticleStatus.APPROVED,
        publishedAt: null,
        scheduledAt: null,
        statusHistory: {
          create: {
            status: ArticleStatus.APPROVED,
            note: 'Hidden from Journal',
            actorId: actor.id,
          },
        },
      },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'article.unpublished',
      resource: 'article',
      resourceId: articleId,
      metadata: { from: article.status },
      requestId,
    });
    return updated;
  }

  /** Worker / scheduler: flip due SCHEDULED articles to PUBLISHED. */
  async processDueSchedules() {
    const due = await this.prisma.article.findMany({
      where: {
        status: ArticleStatus.SCHEDULED,
        scheduledAt: { lte: new Date() },
      },
      take: 20,
    });
    const results: Array<{ id: string; slug: string }> = [];
    for (const a of due) {
      await this.finalizePublish(a.id, null, {
        seoTitle: a.seoTitle ?? a.title,
        seoDescription: a.seoDescription,
        ogImageUrl: a.ogImageUrl,
        categoryId: a.categoryId,
        specialistId: a.specialistId,
      });
      results.push({ id: a.id, slug: a.slug });
    }
    return { published: results.length, articles: results };
  }

  async listPublic(query?: { category?: string; tag?: string }) {
    const rows = await this.prisma.article.findMany({
      where: {
        status: ArticleStatus.PUBLISHED,
        ...(query?.category ? { category: { slug: query.category } } : {}),
        ...(query?.tag ? { tags: { some: { tag: { slug: query.tag } } } } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
      include: {
        category: true,
        specialist: true,
        tags: { include: { tag: true } },
      },
    });
    return rows.map((a) => this.mapPublicSummary(a));
  }

  async getPublicBySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: ArticleStatus.PUBLISHED },
      include: {
        category: true,
        specialist: true,
        tags: { include: { tag: true } },
        assignee: { select: { displayName: true } },
      },
    });
    if (!article) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Article not found.' });
    }
    const updated = await this.prisma.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
      include: {
        category: true,
        specialist: true,
        tags: { include: { tag: true } },
        assignee: { select: { displayName: true } },
      },
    });
    return this.mapPublicDetail(updated);
  }

  async listSpecialists() {
    return this.prisma.specialistProfile.findMany({ orderBy: { name: 'asc' } });
  }

  async getSpecialist(slug: string) {
    const s = await this.prisma.specialistProfile.findUnique({
      where: { slug },
      include: {
        articles: {
          where: { status: ArticleStatus.PUBLISHED },
          orderBy: { publishedAt: 'desc' },
          take: 20,
          select: {
            id: true,
            title: true,
            slug: true,
            seoDescription: true,
            publishedAt: true,
          },
        },
      },
    });
    if (!s) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Specialist not found.' });
    }
    return s;
  }

  async createSpecialist(actor: Actor, body: CreateSpecialistBody, requestId?: string) {
    this.assertOps(actor);
    try {
      const row = await this.prisma.specialistProfile.create({ data: body });
      await this.audit.write({
        actorId: actor.id,
        action: 'specialist.created',
        resource: 'specialist',
        resourceId: row.id,
        requestId,
      });
      return row;
    } catch (e) {
      this.throwIfSlugTaken(e, 'SPECIALIST_SLUG_TAKEN');
      throw e;
    }
  }

  async updateSpecialist(id: string, actor: Actor, body: UpdateSpecialistBody, requestId?: string) {
    this.assertOps(actor);
    const existing = await this.prisma.specialistProfile.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Specialist not found.' });
    }
    try {
      const row = await this.prisma.specialistProfile.update({
        where: { id },
        data: {
          ...(body.slug !== undefined ? { slug: body.slug } : {}),
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.bio !== undefined ? { bio: body.bio } : {}),
          ...(body.credentials !== undefined ? { credentials: body.credentials } : {}),
        },
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'specialist.updated',
        resource: 'specialist',
        resourceId: row.id,
        requestId,
      });
      return row;
    } catch (e) {
      this.throwIfSlugTaken(e, 'SPECIALIST_SLUG_TAKEN');
      throw e;
    }
  }

  async listCategories() {
    return this.prisma.editorialCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async listTags() {
    return this.prisma.articleTag.findMany({
      orderBy: { name: 'asc' },
      take: 200,
      select: { slug: true, name: true },
    });
  }

  async createCategory(actor: Actor, body: CreateEditorialCategoryBody, requestId?: string) {
    this.assertOps(actor);
    try {
      const row = await this.prisma.editorialCategory.create({ data: body });
      await this.audit.write({
        actorId: actor.id,
        action: 'editorial.category.created',
        resource: 'editorial_category',
        resourceId: row.id,
        requestId,
      });
      return row;
    } catch (e) {
      this.throwIfSlugTaken(e, 'CATEGORY_SLUG_TAKEN');
      throw e;
    }
  }

  async updateCategory(
    id: string,
    actor: Actor,
    body: UpdateEditorialCategoryBody,
    requestId?: string,
  ) {
    this.assertOps(actor);
    const existing = await this.prisma.editorialCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Category not found.' });
    }
    try {
      const row = await this.prisma.editorialCategory.update({
        where: { id },
        data: {
          ...(body.slug !== undefined ? { slug: body.slug } : {}),
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
        },
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'editorial.category.updated',
        resource: 'editorial_category',
        resourceId: row.id,
        requestId,
      });
      return row;
    } catch (e) {
      this.throwIfSlugTaken(e, 'CATEGORY_SLUG_TAKEN');
      throw e;
    }
  }

  async newsletterSignup(email: string) {
    return this.prisma.newsletterSignup.upsert({
      where: { email: email.toLowerCase() },
      create: { email: email.toLowerCase() },
      update: {},
    });
  }

  private async finalizePublish(
    articleId: string,
    actorId: string | null,
    meta: {
      seoTitle: string;
      seoDescription: string | null;
      ogImageUrl: string | null;
      categoryId: string | null;
      specialistId: string | null;
      tagIds?: string[];
      requestId?: string;
    },
  ) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Article not found.' });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (meta.tagIds) {
        await tx.articleTagOnArticle.deleteMany({ where: { articleId } });
        if (meta.tagIds.length) {
          await tx.articleTagOnArticle.createMany({
            data: meta.tagIds.map((tagId) => ({ articleId, tagId })),
          });
        }
      }
      const row = await tx.article.update({
        where: { id: articleId },
        data: {
          status: ArticleStatus.PUBLISHED,
          publishedAt: new Date(),
          scheduledAt: null,
          seoTitle: meta.seoTitle,
          seoDescription: meta.seoDescription,
          canonicalPath: articleCanonicalPath(article.slug),
          ogImageUrl: meta.ogImageUrl,
          categoryId: meta.categoryId,
          specialistId: meta.specialistId,
          statusHistory: {
            create: {
              status: ArticleStatus.PUBLISHED,
              note: 'Published',
              actorId,
            },
          },
        },
      });
      if (article.assigneeId) {
        await tx.writerPayment.upsert({
          where: { articleId },
          create: {
            articleId,
            writerId: article.assigneeId,
            amountPaise: DEFAULT_WRITER_FEE_PAISE,
            status: WriterPaymentStatus.PENDING,
          },
          update: {},
        });
      }
      return row;
    });

    await this.audit.write({
      actorId,
      action: 'article.published',
      resource: 'article',
      resourceId: articleId,
      metadata: { slug: article.slug },
      requestId: meta.requestId,
    });
    return updated;
  }

  private async loadForPublish(articleId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: { statusHistory: true },
    });
    if (!article) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Article not found.' });
    }
    return article;
  }

  private assertPublishable(article: {
    status: ArticleStatus;
    medicalGateRequired: boolean;
    statusHistory: Array<{ status: ArticleStatus }>;
  }) {
    const block = publishBlockReason(article);
    if (block === 'NOT_APPROVED') {
      throw new BadRequestException({
        code: 'NOT_APPROVED',
        message: 'Only APPROVED (or already SCHEDULED) articles can be published.',
      });
    }
    if (block === 'MEDICAL_GATE_REQUIRED') {
      throw new ForbiddenException({
        code: 'MEDICAL_GATE_REQUIRED',
        message: 'Medical gate cannot be skipped before publish.',
      });
    }
  }

  private async resolveMeta(body: {
    categorySlug?: string;
    tagSlugs?: string[];
    specialistSlug?: string;
  }) {
    let categoryId: string | undefined;
    let specialistId: string | undefined;
    let tagIds: string[] | undefined;
    if (body.categorySlug) {
      const c = await this.prisma.editorialCategory.findUnique({
        where: { slug: body.categorySlug },
      });
      if (!c) {
        throw new BadRequestException({ code: 'CATEGORY_NOT_FOUND', message: 'Category missing.' });
      }
      categoryId = c.id;
    }
    if (body.specialistSlug) {
      const s = await this.prisma.specialistProfile.findUnique({
        where: { slug: body.specialistSlug },
      });
      if (!s) {
        throw new BadRequestException({
          code: 'SPECIALIST_NOT_FOUND',
          message: 'Specialist missing.',
        });
      }
      specialistId = s.id;
    }
    if (body.tagSlugs !== undefined) {
      tagIds = await upsertArticleTagIds(this.prisma, body.tagSlugs);
    }
    return { categoryId, specialistId, tagIds };
  }

  private parseWhen(raw: string): Date {
    const d = new Date(raw.includes('T') ? raw : `${raw}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException({ code: 'INVALID_DATE', message: 'Invalid datetime.' });
    }
    return d;
  }

  private throwIfSlugTaken(
    e: unknown,
    code: 'CATEGORY_SLUG_TAKEN' | 'SPECIALIST_SLUG_TAKEN',
  ): void {
    if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002') {
      throw new ConflictException({
        code,
        message: 'That slug is already in use.',
      });
    }
  }

  private assertOps(actor: Actor) {
    if (!actor.roles.includes('CONTENT_ADMIN') && !actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Content admin required.' });
    }
  }

  private mapPublicSummary(a: {
    id: string;
    title: string;
    slug: string;
    seoTitle: string | null;
    seoDescription: string | null;
    publishedAt: Date | null;
    viewCount: number;
    ogImageUrl: string | null;
    category: { slug: string; name: string } | null;
    specialist: { slug: string; name: string } | null;
    tags: Array<{ tag: { slug: string; name: string } }>;
  }) {
    return {
      id: a.id,
      title: a.seoTitle ?? a.title,
      slug: a.slug,
      description: a.seoDescription,
      publishedAt: a.publishedAt,
      viewCount: a.viewCount,
      imageUrl: a.ogImageUrl,
      category: a.category,
      specialist: a.specialist,
      tags: a.tags.map((t) => t.tag),
    };
  }

  private mapPublicDetail(
    a: Parameters<PublishingService['mapPublicSummary']>[0] & {
      body: string;
      canonicalPath: string | null;
      ogImageUrl: string | null;
      seoTitle: string | null;
      seoDescription: string | null;
      seoSchemaExtras?: unknown;
      assignee: { displayName: string | null } | null;
    },
  ) {
    return {
      ...this.mapPublicSummary(a),
      body: a.body,
      seo: {
        title: a.seoTitle ?? a.title,
        description: a.seoDescription,
        canonicalPath: articleCanonicalPath(a.slug),
        ogImageUrl: a.ogImageUrl,
      },
      seoSchemaExtras: readSeoSchemaExtras(a.seoSchemaExtras),
      authorName: a.assignee?.displayName ?? null,
    };
  }
}
