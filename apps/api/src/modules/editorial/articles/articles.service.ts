import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleCommentKind, ArticleRevisionSource, ArticleStatus } from '@prisma/client';
import type {
  ArticleCommentBody,
  ArticleTransitionBody,
  CreateArticleBody,
  UpdateArticleBody,
} from '@inabiya/validation';
import type { RoleCode } from '@inabiya/types';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { readSeoSchemaExtras, seoSchemaExtrasWriteValue } from '../../../common/seo-schema-extras';
import { allowedArticleTransitions, canEditArticleBody } from './editorial-transitions';
import { articleCanonicalPath } from '../article-canonical';
import { upsertArticleTagIds } from '../article-tags';
import { defaultWriterFeePaise, canSeeWriterFee } from '../writer-fee';
import { buildArticleTimeline } from '../article-timeline';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function parseDueAt(raw: string | null | undefined): Date | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === '') return null;
  const d = new Date(raw.includes('T') ? raw : `${raw}T23:59:59.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException({
      code: 'INVALID_DUE_AT',
      message: 'Invalid due date.',
    });
  }
  return d;
}

type Actor = { id: string; roles: RoleCode[] };

type ListFilters = {
  mineOnly?: boolean;
  status?: ArticleStatus;
  overdue?: boolean;
  /** Ops queue filter: UUID, or `null` for unassigned only. */
  assigneeId?: string | null;
};

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(actor: Actor, body: CreateArticleBody, requestId?: string) {
    this.assertAnyRole(actor, ['CONTENT_ADMIN', 'SUPER_ADMIN']);
    let slug = body.slug ?? slugify(body.title);
    if (!slug) slug = `article-${Date.now()}`;
    const existing = await this.prisma.article.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
    if (body.assigneeId) {
      await this.assertWriter(body.assigneeId);
    }
    const dueAt = parseDueAt(body.dueAt) ?? null;
    const article = await this.prisma.article.create({
      data: {
        title: body.title,
        slug,
        status: ArticleStatus.ASSIGNED,
        medicalGateRequired: body.medicalGateRequired ?? true,
        assigneeId: body.assigneeId ?? null,
        createdById: actor.id,
        dueAt,
        writerFeePaise: body.writerFeePaise ?? defaultWriterFeePaise(),
        statusHistory: {
          create: {
            status: ArticleStatus.ASSIGNED,
            note: body.brief ?? 'Assignment created',
            actorId: actor.id,
          },
        },
        comments: body.brief
          ? {
              create: {
                authorId: actor.id,
                kind: ArticleCommentKind.COMMENT,
                body: body.brief,
              },
            }
          : undefined,
      },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'article.assigned',
      resource: 'article',
      resourceId: article.id,
      metadata: { slug, assigneeId: body.assigneeId ?? null, dueAt },
      requestId,
    });
    return this.get(article.id, actor);
  }

  async list(actor: Actor, filters: ListFilters = {}) {
    const where: Record<string, unknown> = {};

    if (filters.mineOnly) {
      where.assigneeId = actor.id;
    } else if (this.isOps(actor)) {
      // ops see all (optionally filtered by status below)
    } else if (actor.roles.includes('SEO_EDITOR') && !actor.roles.includes('MEDICAL_REVIEWER')) {
      where.status = filters.status ?? ArticleStatus.SEO_REVIEW;
    } else if (actor.roles.includes('MEDICAL_REVIEWER') && !actor.roles.includes('SEO_EDITOR')) {
      where.status = filters.status ?? ArticleStatus.MEDICAL_REVIEW;
    } else if (actor.roles.includes('SEO_EDITOR') && actor.roles.includes('MEDICAL_REVIEWER')) {
      if (filters.status) {
        where.status = filters.status;
      } else {
        where.status = {
          in: [ArticleStatus.SEO_REVIEW, ArticleStatus.MEDICAL_REVIEW],
        };
      }
    } else if (actor.roles.includes('WRITER')) {
      where.assigneeId = actor.id;
    } else if (actor.roles.includes('FINANCE')) {
      // finance: no article queue by default
      where.id = '00000000-0000-0000-0000-000000000000';
    } else {
      where.assigneeId = actor.id;
    }

    if (filters.overdue) {
      where.dueAt = { lt: new Date() };
      if (!where.status) {
        where.status = { notIn: [ArticleStatus.APPROVED, ArticleStatus.PUBLISHED] };
      }
    } else if (filters.status && this.isOps(actor)) {
      where.status = filters.status;
    } else if (filters.status && actor.roles.includes('WRITER') && filters.mineOnly !== false) {
      where.status = filters.status;
    }

    if (filters.assigneeId !== undefined && this.isOps(actor) && !filters.mineOnly) {
      where.assigneeId = filters.assigneeId;
    }

    const rows = await this.prisma.article.findMany({
      where,
      orderBy: [{ dueAt: 'asc' }, { updatedAt: 'desc' }],
      take: 100,
      include: {
        assignee: { select: { id: true, email: true, displayName: true } },
      },
    });
    return rows.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      status: a.status,
      medicalGateRequired: a.medicalGateRequired,
      dueAt: a.dueAt,
      ...(canSeeWriterFee(actor.roles) ? { writerFeePaise: a.writerFeePaise } : {}),
      overdue: Boolean(a.dueAt && a.dueAt < new Date() && a.status !== ArticleStatus.APPROVED),
      updatedAt: a.updatedAt,
      assignee: a.assignee,
    }));
  }

  async get(id: string, actor: Actor) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, email: true, displayName: true } },
        createdBy: { select: { id: true, email: true, displayName: true } },
        category: { select: { slug: true, name: true } },
        specialist: { select: { slug: true, name: true } },
        tags: { include: { tag: { select: { slug: true, name: true } } } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { email: true, displayName: true } } },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: { actor: { select: { email: true, displayName: true } } },
        },
        revisions: {
          orderBy: { createdAt: 'desc' },
          take: 40,
          include: { actor: { select: { email: true, displayName: true } } },
        },
        writerPayment: true,
      },
    });
    if (!article) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Article not found.' });
    }
    this.assertCanRead(actor, article.assigneeId);
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      body: article.body,
      status: article.status,
      medicalGateRequired: article.medicalGateRequired,
      dueAt: article.dueAt,
      ...(canSeeWriterFee(actor.roles) ? { writerFeePaise: article.writerFeePaise } : {}),
      publishedAt: article.publishedAt,
      ogImageUrl: article.ogImageUrl,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      seoSchemaExtras: readSeoSchemaExtras(article.seoSchemaExtras),
      category: article.category,
      specialist: article.specialist,
      tags: article.tags.map((t) => t.tag),
      assignee: article.assignee,
      createdBy: article.createdBy,
      comments: article.comments.map((c) => ({
        id: c.id,
        kind: c.kind,
        body: c.body,
        authorName: c.author.displayName ?? c.author.email,
        createdAt: c.createdAt,
      })),
      statusHistory: article.statusHistory.map((h) => ({
        status: h.status,
        note: h.note,
        actorEmail: h.actor?.email ?? null,
        actorName: h.actor?.displayName ?? h.actor?.email ?? null,
        createdAt: h.createdAt,
      })),
      revisions: article.revisions.map((r) => ({
        id: r.id,
        title: r.title,
        bodyPreview: r.body.slice(0, 160),
        actorName: r.actor?.displayName ?? r.actor?.email ?? null,
        createdAt: r.createdAt,
      })),
      timeline: buildArticleTimeline({
        statusHistory: article.statusHistory,
        comments: article.comments,
        revisions: article.revisions,
        payment: article.writerPayment,
        includePayment: canSeeWriterFee(actor.roles),
      }),
      allowedTransitions: allowedArticleTransitions(
        article.status,
        article.medicalGateRequired,
        actor,
        article.assigneeId,
      ),
      canEditBody: canEditArticleBody(article.status, actor, article.assigneeId),
    };
  }

  async preview(id: string, actor: Actor) {
    const article = await this.get(id, actor);
    return {
      title: article.title,
      slug: article.slug,
      body: article.body,
      status: article.status,
      internal: true,
    };
  }

  async update(id: string, actor: Actor, body: UpdateArticleBody, requestId?: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { tags: { include: { tag: { select: { slug: true } } } } },
    });
    if (!article) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Article not found.' });
    }
    if (body.body != null && !canEditArticleBody(article.status, actor, article.assigneeId)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Cannot edit article body in this state.',
      });
    }
    if (body.assigneeId !== undefined || body.dueAt !== undefined) {
      this.assertAnyRole(actor, ['CONTENT_ADMIN', 'SUPER_ADMIN']);
      if (body.assigneeId) await this.assertWriter(body.assigneeId);
    }
    if (body.writerFeePaise !== undefined) {
      this.assertAnyRole(actor, ['CONTENT_ADMIN', 'SUPER_ADMIN']);
      if (
        article.status === ArticleStatus.PUBLISHED ||
        article.status === ArticleStatus.SCHEDULED
      ) {
        throw new BadRequestException({
          code: 'FEE_LOCKED',
          message: 'Writer fee cannot change after schedule or publish.',
        });
      }
    }
    if (body.ogImageUrl !== undefined) {
      this.assertAnyRole(actor, ['CONTENT_ADMIN', 'SUPER_ADMIN']);
    }
    if (body.seoSchemaExtras !== undefined) {
      this.assertAnyRole(actor, ['CONTENT_ADMIN', 'SUPER_ADMIN', 'SEO_EDITOR']);
    }
    if (body.seoTitle !== undefined || body.seoDescription !== undefined) {
      this.assertAnyRole(actor, ['CONTENT_ADMIN', 'SUPER_ADMIN', 'SEO_EDITOR']);
    }
    if (body.categorySlug !== undefined || body.specialistSlug !== undefined) {
      this.assertAnyRole(actor, ['CONTENT_ADMIN', 'SUPER_ADMIN']);
    }
    if (body.tagSlugs !== undefined) {
      this.assertAnyRole(actor, ['CONTENT_ADMIN', 'SUPER_ADMIN']);
    }
    if (body.slug !== undefined) {
      this.assertAnyRole(actor, ['CONTENT_ADMIN', 'SUPER_ADMIN']);
    }
    if (body.title != null) {
      this.assertAnyRole(actor, ['CONTENT_ADMIN', 'SUPER_ADMIN', 'WRITER']);
      if (actor.roles.includes('WRITER') && !this.isOps(actor) && article.assigneeId !== actor.id) {
        throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not your assignment.' });
      }
    }

    const nextTitle = body.title ?? article.title;
    const bodyChanged = body.body != null && body.body !== article.body;
    const titleChanged = body.title != null && body.title !== article.title;
    const dueAt = parseDueAt(body.dueAt);
    const taxonomy = await this.resolveTaxonomy({
      categorySlug: body.categorySlug,
      specialistSlug: body.specialistSlug,
    });

    let nextSlug: string | undefined;
    if (body.slug !== undefined) {
      nextSlug = slugify(body.slug);
      if (nextSlug.length < 3) {
        throw new BadRequestException({
          code: 'SLUG_INVALID',
          message: 'Slug must be at least 3 characters.',
        });
      }
      if (nextSlug !== article.slug) {
        const taken = await this.prisma.article.findFirst({
          where: { slug: nextSlug, NOT: { id } },
          select: { id: true },
        });
        if (taken) {
          throw new ConflictException({
            code: 'SLUG_TAKEN',
            message: 'That slug is already in use.',
          });
        }
      }
    }

    const dueMs = (d: Date | null | undefined) => d?.getTime() ?? null;
    const tagKey = (slugs: string[]) => [...slugs].sort().join('|');
    const extrasNow = JSON.stringify(readSeoSchemaExtras(article.seoSchemaExtras) ?? null);
    const extrasNext =
      body.seoSchemaExtras !== undefined ? JSON.stringify(body.seoSchemaExtras) : extrasNow;
    const metaChanged =
      (body.assigneeId !== undefined && body.assigneeId !== article.assigneeId) ||
      (dueAt !== undefined && dueMs(dueAt) !== dueMs(article.dueAt)) ||
      (body.writerFeePaise !== undefined && body.writerFeePaise !== article.writerFeePaise) ||
      (body.ogImageUrl !== undefined && body.ogImageUrl !== article.ogImageUrl) ||
      (body.seoTitle !== undefined && body.seoTitle !== article.seoTitle) ||
      (body.seoDescription !== undefined && body.seoDescription !== article.seoDescription) ||
      (taxonomy.categoryId !== undefined && taxonomy.categoryId !== article.categoryId) ||
      (taxonomy.specialistId !== undefined && taxonomy.specialistId !== article.specialistId) ||
      (nextSlug !== undefined && nextSlug !== article.slug) ||
      (body.seoSchemaExtras !== undefined && extrasNext !== extrasNow) ||
      (body.tagSlugs !== undefined &&
        tagKey(body.tagSlugs) !== tagKey(article.tags.map((t) => t.tag.slug)));

    const updated = await this.prisma.$transaction(async (tx) => {
      if (bodyChanged || titleChanged || metaChanged) {
        await tx.articleRevision.create({
          data: {
            articleId: id,
            title: article.title,
            body: article.body,
            actorId: actor.id,
            source:
              bodyChanged || titleChanged
                ? body.revisionSource === 'manual'
                  ? ArticleRevisionSource.MANUAL
                  : ArticleRevisionSource.AUTO
                : ArticleRevisionSource.META,
          },
        });
      }
      const row = await tx.article.update({
        where: { id },
        data: {
          title: body.title,
          body: body.body,
          assigneeId: body.assigneeId === undefined ? undefined : body.assigneeId,
          dueAt: dueAt === undefined ? undefined : dueAt,
          ...(dueAt !== undefined ? { dueReminderSentAt: null } : {}),
          ...(body.writerFeePaise !== undefined ? { writerFeePaise: body.writerFeePaise } : {}),
          ...(body.ogImageUrl !== undefined ? { ogImageUrl: body.ogImageUrl } : {}),
          ...(body.seoTitle !== undefined ? { seoTitle: body.seoTitle } : {}),
          ...(body.seoDescription !== undefined ? { seoDescription: body.seoDescription } : {}),
          ...(taxonomy.categoryId !== undefined ? { categoryId: taxonomy.categoryId } : {}),
          ...(taxonomy.specialistId !== undefined ? { specialistId: taxonomy.specialistId } : {}),
          ...(nextSlug !== undefined
            ? { slug: nextSlug, canonicalPath: articleCanonicalPath(nextSlug) }
            : {}),
          ...(body.seoSchemaExtras !== undefined
            ? {
                seoSchemaExtras: seoSchemaExtrasWriteValue(body.seoSchemaExtras, {
                  hasSystemFaq: false,
                }),
              }
            : {}),
        },
      });
      if (body.tagSlugs !== undefined) {
        const tagIds = await upsertArticleTagIds(tx, body.tagSlugs);
        await tx.articleTagOnArticle.deleteMany({ where: { articleId: id } });
        if (tagIds.length) {
          await tx.articleTagOnArticle.createMany({
            data: tagIds.map((tagId) => ({ articleId: id, tagId })),
          });
        }
      }
      return row;
    });

    await this.audit.write({
      actorId: actor.id,
      action: 'article.updated',
      resource: 'article',
      resourceId: id,
      metadata: {
        fields: Object.keys(body),
        revisionSaved: bodyChanged || titleChanged,
        nextTitle,
      },
      requestId,
    });
    return this.get(updated.id, actor);
  }

  async turnaroundAnalytics() {
    const open = await this.prisma.article.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const approved = await this.prisma.article.findMany({
      where: { status: ArticleStatus.APPROVED },
      select: {
        createdAt: true,
        statusHistory: {
          where: { status: ArticleStatus.APPROVED },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true },
        },
      },
      take: 200,
    });
    const durations = approved
      .map((a) => {
        const approvedAt = a.statusHistory[0]?.createdAt;
        if (!approvedAt) return null;
        return Math.round((approvedAt.getTime() - a.createdAt.getTime()) / 36e5);
      })
      .filter((n): n is number => n != null);
    const avgHours =
      durations.length === 0
        ? null
        : Math.round(durations.reduce((s, n) => s + n, 0) / durations.length);
    const overdue = await this.prisma.article.count({
      where: {
        dueAt: { lt: new Date() },
        status: { not: ArticleStatus.APPROVED },
      },
    });
    return {
      byStatus: open.map((r) => ({ status: r.status, count: r._count._all })),
      approvedSample: durations.length,
      avgHoursToApprove: avgHours,
      overdueCount: overdue,
    };
  }

  /** Due within 24h or overdue — enqueue reminder once. */
  async scanDueReminders(
    enqueue: (job: {
      articleId: string;
      title: string;
      dueAt: string;
      assigneeEmail: string | null;
    }) => Promise<void>,
  ) {
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const rows = await this.prisma.article.findMany({
      where: {
        dueAt: { lte: soon },
        dueReminderSentAt: null,
        status: { not: ArticleStatus.APPROVED },
      },
      take: 50,
      include: { assignee: { select: { email: true } } },
    });
    let enqueued = 0;
    for (const a of rows) {
      if (!a.dueAt) continue;
      await enqueue({
        articleId: a.id,
        title: a.title,
        dueAt: a.dueAt.toISOString(),
        assigneeEmail: a.assignee?.email ?? null,
      });
      await this.prisma.article.update({
        where: { id: a.id },
        data: { dueReminderSentAt: new Date() },
      });
      enqueued += 1;
    }
    return { scanned: rows.length, enqueued };
  }

  async transition(id: string, actor: Actor, body: ArticleTransitionBody, requestId?: string) {
    // Publish/schedule only via PublishingService (not workflow transition)
    if ((body.status as string) === 'PUBLISHED' || (body.status as string) === 'SCHEDULED') {
      throw new ForbiddenException({
        code: 'USE_PUBLISHING_API',
        message: 'Use POST /editorial/articles/:id/publish or /schedule.',
      });
    }
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Article not found.' });
    }
    const allowed = allowedArticleTransitions(
      article.status,
      article.medicalGateRequired,
      actor,
      article.assigneeId,
    );
    if (!allowed.includes(body.status as ArticleStatus)) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot move from ${article.status} to ${body.status}.`,
      });
    }
    await this.prisma.article.update({
      where: { id },
      data: {
        status: body.status as ArticleStatus,
        statusHistory: {
          create: {
            status: body.status as ArticleStatus,
            note: body.note ?? null,
            actorId: actor.id,
          },
        },
      },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'article.status.updated',
      resource: 'article',
      resourceId: id,
      metadata: { from: article.status, to: body.status, note: body.note ?? null },
      requestId,
    });
    return this.get(id, actor);
  }

  async addComment(id: string, actor: Actor, body: ArticleCommentBody, requestId?: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Article not found.' });
    }
    this.assertCanRead(actor, article.assigneeId);
    const kind =
      body.kind === 'CHANGE_REQUEST'
        ? ArticleCommentKind.CHANGE_REQUEST
        : ArticleCommentKind.COMMENT;
    if (kind === ArticleCommentKind.CHANGE_REQUEST) {
      this.assertAnyRole(actor, ['CONTENT_ADMIN', 'SEO_EDITOR', 'MEDICAL_REVIEWER', 'SUPER_ADMIN']);
    }
    const allowed = allowedArticleTransitions(
      article.status,
      article.medicalGateRequired,
      actor,
      article.assigneeId,
    );
    const sendBack =
      kind === ArticleCommentKind.CHANGE_REQUEST &&
      allowed.includes(ArticleStatus.CHANGES_REQUESTED);
    const comment = await this.prisma.$transaction(async (tx) => {
      const row = await tx.articleComment.create({
        data: { articleId: id, authorId: actor.id, kind, body: body.body },
      });
      if (sendBack) {
        await tx.article.update({
          where: { id },
          data: {
            status: ArticleStatus.CHANGES_REQUESTED,
            statusHistory: {
              create: {
                status: ArticleStatus.CHANGES_REQUESTED,
                note: body.body,
                actorId: actor.id,
              },
            },
          },
        });
      }
      return row;
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'article.comment.added',
      resource: 'article',
      resourceId: id,
      metadata: {
        commentId: comment.id,
        kind,
        status: sendBack ? ArticleStatus.CHANGES_REQUESTED : undefined,
      },
      requestId,
    });
    return this.get(id, actor);
  }

  async returnToDraft(id: string, actor: Actor, requestId?: string) {
    this.assertAnyRole(actor, ['CONTENT_ADMIN', 'SUPER_ADMIN']);
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Article not found.' });
    }
    if (article.status === ArticleStatus.DRAFT || article.status === ArticleStatus.ASSIGNED) {
      throw new BadRequestException({
        code: 'ALREADY_DRAFT',
        message: 'Article is already in writing.',
      });
    }
    const wasPublic =
      article.status === ArticleStatus.PUBLISHED || article.status === ArticleStatus.SCHEDULED;
    await this.prisma.article.update({
      where: { id },
      data: {
        status: ArticleStatus.DRAFT,
        ...(wasPublic ? { publishedAt: null, scheduledAt: null } : {}),
        statusHistory: {
          create: {
            status: ArticleStatus.DRAFT,
            note: wasPublic ? 'Returned to draft (hidden from Journal)' : 'Returned to draft',
            actorId: actor.id,
          },
        },
      },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'article.returned_to_draft',
      resource: 'article',
      resourceId: id,
      metadata: { from: article.status },
      requestId,
    });
    return this.get(id, actor);
  }

  async remove(id: string, actor: Actor, requestId?: string) {
    this.assertAnyRole(actor, ['CONTENT_ADMIN', 'SUPER_ADMIN']);
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Article not found.' });
    }
    if (article.status === ArticleStatus.PUBLISHED || article.status === ArticleStatus.SCHEDULED) {
      throw new BadRequestException({
        code: 'PUBLISHED_LOCKED',
        message: 'Hide the article from Journal before deleting.',
      });
    }
    const payment = await this.prisma.writerPayment.findUnique({ where: { articleId: id } });
    if (payment) {
      throw new BadRequestException({
        code: 'HAS_WRITER_PAYMENT',
        message: 'Cannot delete an article that has a writer payment.',
      });
    }
    await this.prisma.article.delete({ where: { id } });
    await this.audit.write({
      actorId: actor.id,
      action: 'article.deleted',
      resource: 'article',
      resourceId: id,
      metadata: { title: article.title, slug: article.slug, from: article.status },
      requestId,
    });
  }

  async listWriters() {
    const role = await this.prisma.role.findUnique({ where: { code: 'WRITER' } });
    if (!role) return [];
    const rows = await this.prisma.userRole.findMany({
      where: { roleId: role.id },
      include: { user: { select: { id: true, email: true, displayName: true, isActive: true } } },
    });
    return rows.filter((r) => r.user.isActive).map((r) => r.user);
  }

  private async resolveTaxonomy(body: {
    categorySlug?: string | null;
    specialistSlug?: string | null;
  }): Promise<{ categoryId?: string | null; specialistId?: string | null }> {
    let categoryId: string | null | undefined;
    let specialistId: string | null | undefined;
    if (body.categorySlug !== undefined) {
      if (body.categorySlug == null || body.categorySlug === '') {
        categoryId = null;
      } else {
        const c = await this.prisma.editorialCategory.findUnique({
          where: { slug: body.categorySlug },
        });
        if (!c) {
          throw new BadRequestException({
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category missing.',
          });
        }
        categoryId = c.id;
      }
    }
    if (body.specialistSlug !== undefined) {
      if (body.specialistSlug == null || body.specialistSlug === '') {
        specialistId = null;
      } else {
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
    }
    return { categoryId, specialistId };
  }

  private isOps(actor: Actor) {
    return actor.roles.includes('CONTENT_ADMIN') || actor.roles.includes('SUPER_ADMIN');
  }

  private assertAnyRole(actor: Actor, roles: RoleCode[]) {
    if (!roles.some((r) => actor.roles.includes(r))) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Insufficient role.' });
    }
  }

  private assertCanRead(actor: Actor, assigneeId: string | null) {
    if (this.isOps(actor)) return;
    if (actor.roles.includes('SEO_EDITOR') || actor.roles.includes('MEDICAL_REVIEWER')) {
      return;
    }
    if (actor.roles.includes('WRITER') && assigneeId === actor.id) return;
    throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Cannot view this article.' });
  }

  private async assertWriter(userId: string) {
    const link = await this.prisma.userRole.findFirst({
      where: { userId, role: { code: 'WRITER' } },
    });
    if (!link) {
      throw new BadRequestException({
        code: 'INVALID_ASSIGNEE',
        message: 'Assignee must have WRITER role.',
      });
    }
  }
}
