import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, MarketingPageStatus, Prisma } from '@prisma/client';
import {
  GIFT_HOMEPAGE_SLUG,
  type CreateMarketingPageBody,
  type PageBlockInput,
  type UpdateMarketingPageBody,
} from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CatalogService } from '../catalog/catalog.service';

type PageWithBlocks = {
  id: string;
  slug: string;
  title: string;
  status: MarketingPageStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  blocks: Array<{
    id: string;
    type: string;
    sortOrder: number;
    props: Prisma.JsonValue;
  }>;
};

@Injectable()
export class CmsPagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly catalog: CatalogService,
  ) {}

  async listAdmin() {
    const rows = await this.prisma.marketingPage.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { blocks: true } } },
    });
    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      publishedAt: p.publishedAt,
      updatedAt: p.updatedAt,
      blockCount: p._count.blocks,
      isHomepage: p.slug === GIFT_HOMEPAGE_SLUG,
    }));
  }

  async getAdmin(id: string) {
    const page = await this.prisma.marketingPage.findUnique({
      where: { id },
      include: { blocks: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!page) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found.' });
    }
    return this.mapPage(page);
  }

  /** Draft or published — for Soft Gift preview (admin auth). */
  async getPreview(id: string) {
    const page = await this.prisma.marketingPage.findUnique({
      where: { id },
      include: { blocks: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!page) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found.' });
    }
    return this.mapPage(page, { resolveLive: true });
  }

  async getPublicBySlug(slug: string) {
    const page = await this.prisma.marketingPage.findFirst({
      where: { slug, status: MarketingPageStatus.PUBLISHED },
      include: { blocks: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!page) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found.' });
    }
    return this.mapPage(page, { resolveLive: true });
  }

  async create(body: CreateMarketingPageBody, actorId: string, requestId?: string) {
    if (body.slug === GIFT_HOMEPAGE_SLUG) {
      const existingHome = await this.prisma.marketingPage.findUnique({
        where: { slug: GIFT_HOMEPAGE_SLUG },
      });
      if (existingHome) {
        throw new BadRequestException({
          code: 'HOMEPAGE_EXISTS',
          message: 'Soft Gift homepage already exists — edit that page instead.',
        });
      }
    }
    const existing = await this.prisma.marketingPage.findUnique({
      where: { slug: body.slug },
    });
    if (existing) {
      throw new BadRequestException({
        code: 'SLUG_TAKEN',
        message: 'A page with this slug already exists.',
      });
    }
    const blocks = body.blocks ?? [];
    const page = await this.prisma.marketingPage.create({
      data: {
        slug: body.slug,
        title: body.title,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        status: MarketingPageStatus.DRAFT,
        blocks: {
          create: blocks.map((b, i) => ({
            type: b.type,
            sortOrder: i,
            props: b.props as Prisma.InputJsonValue,
          })),
        },
      },
      include: { blocks: { orderBy: { sortOrder: 'asc' } } },
    });
    await this.audit.write({
      actorId,
      action: 'cms.page.create',
      resource: 'marketing_page',
      resourceId: page.id,
      requestId,
    });
    return this.mapPage(page);
  }

  async update(id: string, body: UpdateMarketingPageBody, actorId: string, requestId?: string) {
    const existing = await this.prisma.marketingPage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found.' });
    }

    const page = await this.prisma.$transaction(async (tx) => {
      if (body.blocks !== undefined) {
        await tx.pageBlock.deleteMany({ where: { pageId: id } });
        if (body.blocks.length) {
          await tx.pageBlock.createMany({
            data: body.blocks.map((b: PageBlockInput, i: number) => ({
              pageId: id,
              type: b.type,
              sortOrder: i,
              props: b.props as Prisma.InputJsonValue,
            })),
          });
        }
      }
      return tx.marketingPage.update({
        where: { id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.seoTitle !== undefined ? { seoTitle: body.seoTitle } : {}),
          ...(body.seoDescription !== undefined ? { seoDescription: body.seoDescription } : {}),
        },
        include: { blocks: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    await this.audit.write({
      actorId,
      action: 'cms.page.update',
      resource: 'marketing_page',
      resourceId: id,
      requestId,
    });
    return this.mapPage(page);
  }

  async publish(id: string, actorId: string, requestId?: string) {
    const existing = await this.prisma.marketingPage.findUnique({
      where: { id },
      include: { blocks: true },
    });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found.' });
    }
    if (!existing.blocks.length) {
      throw new BadRequestException({
        code: 'EMPTY_PAGE',
        message: 'Add at least one block before publishing.',
      });
    }
    const page = await this.prisma.marketingPage.update({
      where: { id },
      data: {
        status: MarketingPageStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: { blocks: { orderBy: { sortOrder: 'asc' } } },
    });
    await this.audit.write({
      actorId,
      action: 'cms.page.publish',
      resource: 'marketing_page',
      resourceId: id,
      requestId,
    });
    return this.mapPage(page, { resolveLive: true });
  }

  async unpublish(id: string, actorId: string, requestId?: string) {
    const existing = await this.prisma.marketingPage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found.' });
    }
    if (existing.slug === GIFT_HOMEPAGE_SLUG) {
      throw new BadRequestException({
        code: 'HOMEPAGE_LOCKED',
        message: 'Cannot unpublish the Soft Gift homepage — edit blocks instead.',
      });
    }
    const page = await this.prisma.marketingPage.update({
      where: { id },
      data: {
        status: MarketingPageStatus.DRAFT,
        publishedAt: null,
      },
      include: { blocks: { orderBy: { sortOrder: 'asc' } } },
    });
    await this.audit.write({
      actorId,
      action: 'cms.page.unpublish',
      resource: 'marketing_page',
      resourceId: id,
      requestId,
    });
    return this.mapPage(page);
  }

  async remove(id: string, actorId: string, requestId?: string) {
    const existing = await this.prisma.marketingPage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found.' });
    }
    if (existing.slug === GIFT_HOMEPAGE_SLUG) {
      throw new BadRequestException({
        code: 'HOMEPAGE_LOCKED',
        message: 'Cannot delete the Soft Gift homepage.',
      });
    }
    await this.prisma.marketingPage.delete({ where: { id } });
    await this.audit.write({
      actorId,
      action: 'cms.page.delete',
      resource: 'marketing_page',
      resourceId: id,
      requestId,
    });
    return { ok: true };
  }

  private mapProductCard(p: {
    id: string;
    slug: string;
    title: string;
    fromPricePaise: number;
    media: Array<{ url: string; altText: string | null }>;
  }) {
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      fromPricePaise: p.fromPricePaise,
      media: p.media.map((m) => ({ url: m.url, altText: m.altText })),
    };
  }

  private async resolveProductGridProps(props: Record<string, unknown>) {
    const title = typeof props.title === 'string' ? props.title : undefined;
    const category = typeof props.category === 'string' ? props.category : undefined;
    const hamper = props.hamper === true;
    const limit =
      typeof props.limit === 'number' && props.limit > 0 ? Math.min(props.limit, 24) : undefined;
    const seeAllHref = typeof props.seeAllHref === 'string' ? props.seeAllHref : undefined;
    const slugs = Array.isArray(props.productSlugs)
      ? props.productSlugs.map(String).filter(Boolean)
      : [];

    let products: ReturnType<CmsPagesService['mapProductCard']>[] = [];

    if (slugs.length) {
      const listed = await this.catalog.listPublishedProducts({ sort: 'newest' });
      const bySlug = new Map(listed.map((p) => [p.slug, p]));
      products = slugs
        .map((s) => bySlug.get(s))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((p) => this.mapProductCard(p));
    } else {
      const listed = await this.catalog.listPublishedProducts({
        ...(category ? { category } : {}),
        ...(hamper ? { hamper: '1' as const } : {}),
        sort: 'newest',
      });
      const take = limit ?? (hamper ? 3 : 8);
      products = listed.slice(0, take).map((p) => this.mapProductCard(p));
    }

    if (limit && slugs.length) {
      products = products.slice(0, limit);
    }

    return {
      ...(title ? { title } : {}),
      ...(slugs.length ? { productSlugs: slugs } : {}),
      ...(category ? { category } : {}),
      ...(hamper ? { hamper: true } : {}),
      ...(limit ? { limit } : {}),
      ...(seeAllHref ? { seeAllHref } : {}),
      products,
    };
  }

  private async resolveBrandStripProps(props: Record<string, unknown>) {
    const title = typeof props.title === 'string' ? props.title : undefined;
    const subtitle = typeof props.subtitle === 'string' ? props.subtitle : undefined;
    const showUsps = props.showUsps !== false;
    const usps = Array.isArray(props.usps) ? props.usps : undefined;
    let brands = Array.isArray(props.brands) ? props.brands.slice(0, 24) : [];
    if (!brands.length) {
      const listed = await this.catalog.listPublishedProducts({ sort: 'newest' });
      brands = Array.from(
        new Set(listed.map((p) => p.brandName).filter((b): b is string => Boolean(b))),
      ).slice(0, 8);
    }
    return {
      ...(title ? { title } : {}),
      ...(subtitle ? { subtitle } : {}),
      brands,
      ...(usps ? { usps } : {}),
      showUsps,
    };
  }

  private async resolveArticleTeasersProps(props: Record<string, unknown>) {
    const overline = typeof props.overline === 'string' ? props.overline : undefined;
    const title = typeof props.title === 'string' ? props.title : undefined;
    const seeAllHref = typeof props.seeAllHref === 'string' ? props.seeAllHref : undefined;
    const seeAllLabel = typeof props.seeAllLabel === 'string' ? props.seeAllLabel : undefined;
    const limit =
      typeof props.limit === 'number' && props.limit > 0 ? Math.min(props.limit, 12) : 3;
    const rows = await this.prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        slug: true,
        title: true,
        seoTitle: true,
        seoDescription: true,
        publishedAt: true,
        ogImageUrl: true,
        category: { select: { name: true, slug: true } },
        specialist: { select: { name: true, slug: true } },
      },
    });
    return {
      ...(overline ? { overline } : {}),
      ...(title ? { title } : {}),
      ...(seeAllHref ? { seeAllHref } : {}),
      ...(seeAllLabel ? { seeAllLabel } : {}),
      limit,
      articles: rows.map((a) => ({
        slug: a.slug,
        title: a.seoTitle ?? a.title,
        description: a.seoDescription,
        publishedAt: a.publishedAt,
        imageUrl: a.ogImageUrl,
        category: a.category,
        specialist: a.specialist,
      })),
    };
  }

  private async resolveHeroProps(props: Record<string, unknown>) {
    if (props.variant !== 'storefront' || props.imageUrl) return props;
    const listed = await this.catalog.listPublishedProducts({ sort: 'newest' });
    const hampers = await this.catalog.listPublishedProducts({
      hamper: '1',
      sort: 'newest',
    });
    const imageUrl = listed[0]?.media[0]?.url ?? hampers[0]?.media[0]?.url ?? undefined;
    return imageUrl ? { ...props, imageUrl } : props;
  }

  private async mapPage(page: PageWithBlocks, opts?: { resolveLive?: boolean }) {
    const blocks = [];
    for (const b of page.blocks) {
      const raw =
        b.props && typeof b.props === 'object' && !Array.isArray(b.props)
          ? (b.props as Record<string, unknown>)
          : {};
      let props: Record<string, unknown> = { ...raw };
      if (opts?.resolveLive) {
        if (b.type === 'productGrid') {
          props = await this.resolveProductGridProps(raw);
        } else if (b.type === 'brandStrip') {
          props = await this.resolveBrandStripProps(raw);
        } else if (b.type === 'articleTeasers') {
          props = await this.resolveArticleTeasersProps(raw);
        } else if (b.type === 'hero') {
          props = await this.resolveHeroProps(raw);
        }
      }
      blocks.push({
        id: b.id,
        type: b.type,
        sortOrder: b.sortOrder,
        props,
      });
    }
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      status: page.status,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      publishedAt: page.publishedAt,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      isHomepage: page.slug === GIFT_HOMEPAGE_SLUG,
      blocks,
    };
  }
}
