import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus, ReviewStatus } from '@prisma/client';
import type {
  AdminCatalogListQuery,
  CreateCollectionBody,
  CreateProductBody,
  ProductImportBody,
  UpdateCollectionBody,
  UpdateProductBody,
  UpdateVariantBody,
} from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { InventoryService } from '../inventory/inventory.service';
import { CommercePolicyService } from '../ops/commerce-policy.service';
import {
  adminProductKeysetAfter,
  createdKeysetAfter,
  decodeAdminProductCursor,
  decodeCreatedCursor,
  decodePriceCursor,
  decodeTitleCursor,
  encodeAdminListCursor,
  priceRankAfter,
  titleKeysetAfter,
  type AdminListSort,
} from './admin-catalog-cursor';
import { collectionDeleteBlocked } from './collection-ops';
import {
  applySmartRulesToWhere,
  parseSmartRules,
  smartRulesHideFacets,
  smartRulesNeedOnSalePostFilter,
} from './collection-smart';
import {
  isManualStorefrontLabel,
  resolveStorefrontDisplayLabels,
  saleAnchorPrices,
} from './storefront-display-labels';
import { readSeoSchemaExtras, seoSchemaExtrasWriteValue } from '../../../common/seo-schema-extras';
const productInclude = {
  variants: { include: { inventory: true }, orderBy: { createdAt: 'asc' as const } },
  media: { orderBy: { sortOrder: 'asc' as const } },
  collections: { include: { collection: true } },
  personalizationOpts: { orderBy: { sortOrder: 'asc' as const } },
  hamperItems: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.ProductInclude;

/** Desk list — no SEO/hamper/personalization/collections; one thumb + variants for stock/price. */
const adminListInclude = {
  variants: {
    select: {
      id: true,
      sku: true,
      label: true,
      pricePaise: true,
      inventory: { select: { onHand: true, reserved: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  media: {
    where: { kind: 'IMAGE' as const },
    orderBy: { sortOrder: 'asc' as const },
    take: 1,
    select: { url: true, altText: true, kind: true },
  },
} satisfies Prisma.ProductInclude;

export type ProductDto = ReturnType<CatalogService['mapProduct']>;
export type AdminProductListItem = ReturnType<CatalogService['mapAdminListProduct']>;

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly inventory: InventoryService,
    private readonly policy: CommercePolicyService,
  ) {}

  async listCollections() {
    const rows = await this.prisma.collection.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ createdAt: 'asc' }, { title: 'asc' }],
    });
    return rows.map((c) => this.mapCollectionPublic(c));
  }

  async getPublishedCollectionBySlug(slug: string) {
    const row = await this.prisma.collection.findFirst({
      where: { slug, status: 'PUBLISHED' },
    });
    if (!row) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }
    return this.mapCollectionPublic(row);
  }

  /** Admin desk — MANUAL join count; SMART = live condition match count. */
  async listAdminCollections() {
    const rows = await this.prisma.collection.findMany({
      orderBy: [{ createdAt: 'asc' }, { title: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    const out = [];
    for (const c of rows) {
      let productCount = c._count.products;
      if (c.membershipMode === 'SMART') {
        productCount = await this.countSmartMatches(parseSmartRules(c.smartRules));
      }
      out.push(this.mapCollectionAdmin({ ...c, _count: { products: productCount } }));
    }
    return out;
  }

  async getAdminCollection(id: string) {
    const row = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
        products: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                title: true,
                status: true,
                media: {
                  where: { kind: 'IMAGE' },
                  select: { url: true, altText: true },
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!row) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }

    if (row.membershipMode === 'SMART') {
      const rules = parseSmartRules(row.smartRules);
      const products = await this.listSmartMatchProducts(rules);
      return {
        ...this.mapCollectionAdmin({ ...row, _count: { products: products.length } }),
        products,
        productsSource: 'smart' as const,
      };
    }

    return {
      ...this.mapCollectionAdmin(row),
      products: row.products.map((pc) => {
        const thumb = pc.product.media[0];
        return {
          id: pc.product.id,
          slug: pc.product.slug,
          title: pc.product.title,
          status: pc.product.status,
          sortOrder: pc.sortOrder,
          imageUrl: thumb?.url ?? null,
          imageAlt: thumb?.altText ?? null,
        };
      }),
      productsSource: 'manual' as const,
    };
  }

  private async listSmartMatchProducts(rules: ReturnType<typeof parseSmartRules>) {
    const where = applySmartRulesToWhere({ status: ProductStatus.PUBLISHED }, rules);
    const rows = await this.prisma.product.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        variants: { select: { pricePaise: true, compareAtPricePaise: true } },
        media: {
          where: { kind: 'IMAGE' },
          select: { url: true, altText: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
      orderBy: { title: 'asc' },
      take: 200,
    });
    let filtered = rows;
    if (smartRulesNeedOnSalePostFilter(rules)) {
      filtered = rows.filter((p) =>
        p.variants.some(
          (v) => v.compareAtPricePaise != null && v.compareAtPricePaise > v.pricePaise,
        ),
      );
    }
    return filtered.map((p, i) => {
      const thumb = p.media[0];
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        status: p.status,
        sortOrder: i,
        imageUrl: thumb?.url ?? null,
        imageAlt: thumb?.altText ?? null,
      };
    });
  }

  private async countSmartMatches(rules: ReturnType<typeof parseSmartRules>) {
    return (await this.listSmartMatchProducts(rules)).length;
  }

  async createCollection(body: CreateCollectionBody, actorId: string, requestId?: string) {
    const mode = body.membershipMode ?? 'MANUAL';
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const created = await tx.collection.create({
          data: {
            slug: body.slug,
            title: body.title,
            description: body.description,
            overline: body.overline,
            heroImageUrl: body.heroImageUrl,
            heroImageAlt: body.heroImageAlt,
            accent: body.accent ?? 'neutral',
            sortOrder: body.sortOrder ?? 0,
            status: body.status ?? 'DRAFT',
            membershipMode: mode,
            smartRules:
              mode === 'SMART'
                ? (body.smartRules ?? { match: 'all', conditions: [] })
                : Prisma.DbNull,
            relatedSlugs: body.relatedSlugs ?? [],
            lockedLabel: body.lockedLabel,
            seoTitle: body.seoTitle ?? null,
            seoDescription: body.seoDescription ?? null,
            canonicalPath: body.canonicalPath ?? null,
            ogImageUrl: body.ogImageUrl ?? null,
            robotsIndex: body.robotsIndex ?? true,
          },
        });
        if (mode === 'MANUAL' && body.productSlugs?.length) {
          await this.replaceManualProducts(tx, created.id, body.productSlugs);
        }
        return tx.collection.findUniqueOrThrow({
          where: { id: created.id },
          include: { _count: { select: { products: true } } },
        });
      });
      await this.audit.write({
        actorId,
        action: 'catalog.collection.create',
        resource: 'collection',
        resourceId: row.id,
        requestId,
      });
      let productCount = row._count.products;
      if (row.membershipMode === 'SMART') {
        productCount = await this.countSmartMatches(parseSmartRules(row.smartRules));
      }
      return this.mapCollectionAdmin({ ...row, _count: { products: productCount } });
    } catch (e) {
      if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException({
          code: 'COLLECTION_SLUG_TAKEN',
          message: 'A collection with this slug already exists.',
        });
      }
      throw e;
    }
  }

  async updateCollection(
    id: string,
    body: UpdateCollectionBody,
    actorId: string,
    requestId?: string,
  ) {
    const existing = await this.prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }
    const nextMode = body.membershipMode ?? existing.membershipMode;
    if (nextMode === 'SMART' && body.productSlugs?.length) {
      throw new BadRequestException({
        code: 'INVALID_MEMBERSHIP',
        message: 'Smart collections cannot assign productSlugs.',
      });
    }
    if (
      nextMode === 'SMART' &&
      body.smartRules !== undefined &&
      body.smartRules !== null &&
      !body.smartRules.conditions.length
    ) {
      throw new BadRequestException({
        code: 'INVALID_SMART_RULES',
        message: 'Smart collections need at least one condition.',
      });
    }
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const modeChanged =
          body.membershipMode !== undefined && body.membershipMode !== existing.membershipMode;
        if (modeChanged && nextMode === 'SMART') {
          await tx.productCollection.deleteMany({ where: { collectionId: id } });
        }
        await tx.collection.update({
          where: { id },
          data: {
            ...(body.slug !== undefined ? { slug: body.slug } : {}),
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.overline !== undefined ? { overline: body.overline } : {}),
            ...(body.heroImageUrl !== undefined ? { heroImageUrl: body.heroImageUrl } : {}),
            ...(body.heroImageAlt !== undefined ? { heroImageAlt: body.heroImageAlt } : {}),
            ...(body.accent !== undefined ? { accent: body.accent } : {}),
            ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
            ...(body.status !== undefined ? { status: body.status } : {}),
            ...(body.membershipMode !== undefined ? { membershipMode: body.membershipMode } : {}),
            ...(body.smartRules !== undefined
              ? {
                  smartRules:
                    nextMode === 'SMART' ? (body.smartRules ?? Prisma.DbNull) : Prisma.DbNull,
                }
              : modeChanged && nextMode === 'MANUAL'
                ? { smartRules: Prisma.DbNull }
                : {}),
            ...(body.relatedSlugs !== undefined ? { relatedSlugs: body.relatedSlugs } : {}),
            ...(body.lockedLabel !== undefined ? { lockedLabel: body.lockedLabel } : {}),
            ...(body.seoTitle !== undefined ? { seoTitle: body.seoTitle } : {}),
            ...(body.seoDescription !== undefined ? { seoDescription: body.seoDescription } : {}),
            ...(body.canonicalPath !== undefined ? { canonicalPath: body.canonicalPath } : {}),
            ...(body.ogImageUrl !== undefined ? { ogImageUrl: body.ogImageUrl } : {}),
            ...(body.robotsIndex !== undefined ? { robotsIndex: body.robotsIndex } : {}),
          },
        });
        if (nextMode === 'MANUAL' && body.productSlugs !== undefined) {
          await this.replaceManualProducts(tx, id, body.productSlugs);
        }
        return tx.collection.findUniqueOrThrow({
          where: { id },
          include: { _count: { select: { products: true } } },
        });
      });
      await this.audit.write({
        actorId,
        action: 'catalog.collection.update',
        resource: 'collection',
        resourceId: row.id,
        requestId,
      });
      let productCount = row._count.products;
      if (row.membershipMode === 'SMART') {
        productCount = await this.countSmartMatches(parseSmartRules(row.smartRules));
      }
      return this.mapCollectionAdmin({ ...row, _count: { products: productCount } });
    } catch (e) {
      if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException({
          code: 'COLLECTION_SLUG_TAKEN',
          message: 'A collection with this slug already exists.',
        });
      }
      throw e;
    }
  }

  async deleteCollection(id: string, actorId: string, requestId?: string) {
    const existing = await this.prisma.collection.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Collection not found.' });
    }
    if (collectionDeleteBlocked(existing.membershipMode, existing._count.products)) {
      throw new ConflictException({
        code: 'COLLECTION_HAS_PRODUCTS',
        message: 'Unassign products from this collection before deleting.',
      });
    }
    await this.prisma.collection.delete({ where: { id } });
    await this.audit.write({
      actorId,
      action: 'catalog.collection.delete',
      resource: 'collection',
      resourceId: id,
      requestId,
    });
    return { ok: true as const };
  }

  private mapCollectionPublic(c: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    overline: string | null;
    heroImageUrl: string | null;
    heroImageAlt: string | null;
    accent: string;
    sortOrder: number;
    createdAt: Date;
    membershipMode: 'MANUAL' | 'SMART';
    smartRules: unknown;
    relatedSlugs: string[];
    lockedLabel: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalPath: string | null;
    ogImageUrl: string | null;
    robotsIndex: boolean;
  }) {
    const smartRules =
      c.membershipMode === 'SMART'
        ? parseSmartRules(c.smartRules)
        : { match: 'all' as const, conditions: [] };
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      overline: c.overline,
      heroImageUrl: c.heroImageUrl,
      heroImageAlt: c.heroImageAlt,
      accent: c.accent,
      sortOrder: c.sortOrder,
      createdAt: c.createdAt.toISOString(),
      membershipMode: c.membershipMode,
      smartRules: c.membershipMode === 'SMART' ? smartRules : null,
      hideFacets: c.membershipMode === 'SMART' ? smartRulesHideFacets(smartRules) : [],
      relatedSlugs: c.relatedSlugs,
      lockedLabel: c.lockedLabel,
      seoTitle: c.seoTitle,
      seoDescription: c.seoDescription,
      canonicalPath: c.canonicalPath,
      ogImageUrl: c.ogImageUrl,
      robotsIndex: c.robotsIndex,
    };
  }

  private mapCollectionAdmin(c: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    overline: string | null;
    heroImageUrl: string | null;
    heroImageAlt: string | null;
    accent: string;
    sortOrder: number;
    createdAt: Date;
    status: 'DRAFT' | 'PUBLISHED';
    membershipMode: 'MANUAL' | 'SMART';
    smartRules: unknown;
    relatedSlugs: string[];
    lockedLabel: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalPath: string | null;
    ogImageUrl: string | null;
    robotsIndex: boolean;
    _count: { products: number };
  }) {
    return {
      ...this.mapCollectionPublic(c),
      status: c.status,
      productCount: c._count.products,
    };
  }

  private async replaceManualProducts(
    tx: Prisma.TransactionClient,
    collectionId: string,
    productSlugs: string[],
  ) {
    await tx.productCollection.deleteMany({ where: { collectionId } });
    if (!productSlugs.length) return;
    const products = await tx.product.findMany({
      where: { slug: { in: productSlugs } },
      select: { id: true, slug: true },
    });
    if (products.length !== productSlugs.length) {
      throw new BadRequestException({
        code: 'PRODUCT_SLUGS_INVALID',
        message: 'One or more product slugs were not found.',
      });
    }
    const bySlug = new Map(products.map((p) => [p.slug, p.id]));
    await tx.productCollection.createMany({
      data: productSlugs.map((slug, i) => ({
        collectionId,
        productId: bySlug.get(slug)!,
        sortOrder: i,
      })),
    });
  }

  async listPublishedProducts(query: {
    q?: string;
    collection?: string;
    recipient?: string;
    age?: string;
    occasion?: string;
    hamper?: '0' | '1';
    sort?: 'newest' | 'price_asc' | 'price_desc';
    storefrontLabel?: 'BESTSELLER' | 'EDITORS_PICK' | 'GIFT_SET';
    onSale?: boolean;
    publishedSince?: Date;
    maxPricePaise?: number;
  }) {
    let where: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.recipient === 'girl' || query.recipient === 'boy'
        ? { recipientTags: { hasSome: [query.recipient, 'unisex'] } }
        : query.recipient
          ? { recipientTags: { has: query.recipient } }
          : {}),
      ...(query.age && query.age !== 'any'
        ? { ageBands: { hasSome: [query.age, 'any'] } }
        : query.age === 'any'
          ? { ageBands: { has: 'any' } }
          : {}),
      ...(query.occasion ? { occasionTags: { has: query.occasion } } : {}),
      ...(query.hamper === '1' ? { isReadyMadeHamper: true } : {}),
      ...(query.storefrontLabel ? { storefrontLabels: { has: query.storefrontLabel } } : {}),
      ...(query.publishedSince ? { publishedAt: { gte: query.publishedSince } } : {}),
      ...(query.onSale ? { variants: { some: { compareAtPricePaise: { not: null } } } } : {}),
    };

    const sort = query.sort;
    if (query.collection) {
      const col = await this.prisma.collection.findFirst({
        where: { slug: query.collection, status: 'PUBLISHED' },
      });
      if (!col) {
        return [];
      }
      if (col.membershipMode === 'MANUAL') {
        where = {
          ...where,
          collections: { some: { collectionId: col.id } },
        };
      } else {
        const rules = parseSmartRules(col.smartRules);
        where = applySmartRulesToWhere(where, rules);
        if (smartRulesNeedOnSalePostFilter(rules) && query.onSale === undefined) {
          query = { ...query, onSale: true };
        }
      }
    }

    const products = await this.prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { publishedAt: 'desc' },
    });

    let mapped = products.map((p) => this.mapProduct(p));
    if (query.onSale) {
      mapped = mapped.filter((p) =>
        p.variants.some(
          (v) => v.compareAtPricePaise != null && v.compareAtPricePaise > v.pricePaise,
        ),
      );
    }
    if (query.maxPricePaise != null) {
      mapped = mapped.filter((p) => p.fromPricePaise <= query.maxPricePaise!);
    }
    if (sort === 'price_asc') {
      mapped.sort((a, b) => a.fromPricePaise - b.fromPricePaise);
    } else if (sort === 'price_desc') {
      mapped.sort((a, b) => b.fromPricePaise - a.fromPricePaise);
    }
    return this.attachReviewSummaries(mapped);
  }

  async getPublishedProductBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.PUBLISHED },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found.' });
    }
    const [withReviews] = await this.attachReviewSummaries([this.mapProduct(product)]);
    return withReviews!;
  }

  async listAdminProducts(query: AdminCatalogListQuery) {
    const limit = query.limit ?? 25;
    const sort = (query.sort ?? 'updated') as AdminListSort;
    const andParts: Prisma.ProductWhereInput[] = [];

    if (query.status) andParts.push({ status: query.status });

    if (query.q?.trim()) {
      const term = query.q.trim();
      andParts.push({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { slug: { contains: term, mode: 'insensitive' } },
          { brandName: { contains: term, mode: 'insensitive' } },
          { variants: { some: { sku: { contains: term, mode: 'insensitive' } } } },
        ],
      });
    }

    if (query.hamper === '1') andParts.push({ isReadyMadeHamper: true });
    if (query.hamper === '0') andParts.push({ isReadyMadeHamper: false });

    if (query.storefrontLabel) {
      andParts.push({ storefrontLabels: { has: query.storefrontLabel } });
    }

    if (query.recipient === 'girl' || query.recipient === 'boy') {
      andParts.push({ recipientTags: { hasSome: [query.recipient, 'unisex'] } });
    } else if (query.recipient) {
      andParts.push({ recipientTags: { has: query.recipient } });
    }

    if (query.occasion) {
      andParts.push({ occasionTags: { has: query.occasion } });
    }

    if (query.collection?.trim()) {
      andParts.push({
        collections: { some: { collection: { slug: query.collection.trim() } } },
      });
    }

    if (query.stock) {
      const threshold = await this.policy.getLowStockThreshold();
      const stockIds = await this.productIdsMatchingStock(query.stock, threshold);
      if (stockIds.length === 0) {
        return { items: [], nextCursor: null, limit };
      }
      andParts.push({ id: { in: stockIds } });
    }

    const where: Prisma.ProductWhereInput = andParts.length > 0 ? { AND: andParts } : {};

    // ponytail: price sorts rank in memory (≤500) → SQL min-price keyset if catalog grows
    if (sort === 'price_asc' || sort === 'price_desc') {
      return this.listAdminProductsByPrice(where, sort, query.cursor, limit);
    }

    if (query.cursor) {
      try {
        if (sort === 'updated') {
          andParts.push(
            adminProductKeysetAfter(
              decodeAdminProductCursor(query.cursor),
            ) as Prisma.ProductWhereInput,
          );
        } else if (sort === 'title_asc' || sort === 'title_desc') {
          andParts.push(
            titleKeysetAfter(
              sort,
              decodeTitleCursor(sort, query.cursor),
            ) as Prisma.ProductWhereInput,
          );
        } else if (sort === 'created') {
          andParts.push(
            createdKeysetAfter(decodeCreatedCursor(query.cursor)) as Prisma.ProductWhereInput,
          );
        }
      } catch {
        throw new BadRequestException({
          code: 'INVALID_CURSOR',
          message: 'Invalid pagination cursor.',
        });
      }
    }

    const whereWithCursor: Prisma.ProductWhereInput = andParts.length > 0 ? { AND: andParts } : {};

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sort === 'title_asc'
        ? [{ title: 'asc' }, { id: 'asc' }]
        : sort === 'title_desc'
          ? [{ title: 'desc' }, { id: 'desc' }]
          : sort === 'created'
            ? [{ createdAt: 'desc' }, { id: 'desc' }]
            : [{ updatedAt: 'desc' }, { id: 'desc' }];

    const rows = await this.prisma.product.findMany({
      where: whereWithCursor,
      include: adminListInclude,
      orderBy,
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const items = page.map((p) => this.mapAdminListProduct(p));
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeAdminListCursor(sort, {
            id: last.id,
            updatedAt: last.updatedAt,
            createdAt: last.createdAt,
            title: last.title,
          })
        : null;

    return { items, nextCursor, limit };
  }

  /** Price rank for ops desk — capped candidate set, then keyset-style slice. */
  private async listAdminProductsByPrice(
    where: Prisma.ProductWhereInput,
    sort: 'price_asc' | 'price_desc',
    cursorRaw: string | undefined,
    limit: number,
  ) {
    const candidates = await this.prisma.product.findMany({
      where,
      select: {
        id: true,
        variants: { select: { pricePaise: true } },
      },
      take: 500,
    });

    let ranked = candidates
      .map((p) => ({
        id: p.id,
        fromPricePaise:
          p.variants.length > 0
            ? Math.min(...p.variants.map((v) => v.pricePaise))
            : Number.POSITIVE_INFINITY,
      }))
      .sort((a, b) => {
        if (a.fromPricePaise !== b.fromPricePaise) {
          return sort === 'price_asc'
            ? a.fromPricePaise - b.fromPricePaise
            : b.fromPricePaise - a.fromPricePaise;
        }
        return sort === 'price_asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
      });

    if (cursorRaw) {
      try {
        ranked = priceRankAfter(sort, ranked, decodePriceCursor(sort, cursorRaw));
      } catch {
        throw new BadRequestException({
          code: 'INVALID_CURSOR',
          message: 'Invalid pagination cursor.',
        });
      }
    }

    const pageMeta = ranked.slice(0, limit);
    const hasMore = ranked.length > limit;
    if (pageMeta.length === 0) {
      return { items: [], nextCursor: null, limit };
    }

    const rows = await this.prisma.product.findMany({
      where: { id: { in: pageMeta.map((p) => p.id) } },
      include: adminListInclude,
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const page = pageMeta.map((m) => byId.get(m.id)).filter(Boolean) as Array<
      Prisma.ProductGetPayload<{ include: typeof adminListInclude }>
    >;
    const items = page.map((p) => this.mapAdminListProduct(p));
    const lastMeta = pageMeta[pageMeta.length - 1];
    const nextCursor =
      hasMore && lastMeta
        ? encodeAdminListCursor(sort, {
            id: lastMeta.id,
            fromPricePaise:
              lastMeta.fromPricePaise === Number.POSITIVE_INFINITY ? 0 : lastMeta.fromPricePaise,
          })
        : null;

    return { items, nextCursor, limit };
  }

  private async productIdsMatchingStock(
    stock: 'low' | 'out' | 'in',
    threshold: number,
  ): Promise<string[]> {
    if (stock === 'low') {
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT DISTINCT p.id
        FROM products p
        INNER JOIN product_variants v ON v.product_id = p.id
        INNER JOIN inventory_items i ON i.variant_id = v.id
        WHERE (i.on_hand - i.reserved) <= ${threshold}
      `;
      return rows.map((r) => r.id);
    }
    if (stock === 'out') {
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT p.id
        FROM products p
        LEFT JOIN product_variants v ON v.product_id = p.id
        LEFT JOIN inventory_items i ON i.variant_id = v.id
        GROUP BY p.id
        HAVING COALESCE(MAX(i.on_hand - i.reserved), 0) <= 0
      `;
      return rows.map((r) => r.id);
    }
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT p.id
      FROM products p
      INNER JOIN product_variants v ON v.product_id = p.id
      INNER JOIN inventory_items i ON i.variant_id = v.id
      WHERE (i.on_hand - i.reserved) > 0
    `;
    return rows.map((r) => r.id);
  }

  async getAdminProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found.' });
    }
    return this.mapProduct(product);
  }

  async createProduct(body: CreateProductBody, actorId: string, requestId?: string) {
    const collectionIds = await this.resolveCollectionIds(body.collectionSlugs ?? []);

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          slug: body.slug,
          title: body.title,
          description: body.description,
          status: ProductStatus.DRAFT,
          recipientTags: body.recipientTags ?? [],
          ageBands: body.ageBands ?? [],
          occasionTags: body.occasionTags ?? [],
          isReadyMadeHamper: body.isReadyMadeHamper ?? false,
          brandName: body.brandName,
          storefrontLabels: body.storefrontLabels ?? [],
          ...(body.seoTitle !== undefined ? { seoTitle: body.seoTitle } : {}),
          ...(body.seoDescription !== undefined ? { seoDescription: body.seoDescription } : {}),
          ...(body.canonicalPath !== undefined ? { canonicalPath: body.canonicalPath } : {}),
          ...(body.ogImageUrl !== undefined ? { ogImageUrl: body.ogImageUrl } : {}),
          ...(body.robotsIndex !== undefined ? { robotsIndex: body.robotsIndex } : {}),
          collections: {
            create: collectionIds.map((collectionId) => ({ collectionId })),
          },
          media: body.media?.length
            ? {
                create: body.media.map((m, i) => ({
                  url: m.url,
                  altText: m.altText,
                  sortOrder: m.sortOrder ?? i,
                  kind: m.kind ?? ('IMAGE' as const),
                  posterUrl: m.posterUrl ?? null,
                })),
              }
            : undefined,
          personalizationOpts: body.personalization?.length
            ? {
                create: body.personalization.map((o, i) => ({
                  key: o.key,
                  label: o.label,
                  type: o.type ?? 'TEXT',
                  maxLength: o.maxLength,
                  options: o.options,
                  required: o.required ?? false,
                  sortOrder: i,
                })),
              }
            : undefined,
          variants: {
            create: body.variants.map((v) => {
              const compareAt =
                v.compareAtPricePaise === undefined ? undefined : v.compareAtPricePaise;
              if (compareAt != null && compareAt < v.pricePaise) {
                throw new BadRequestException({
                  code: 'INVALID_COMPARE_AT',
                  message: 'MRP (compare-at) must be greater than or equal to price.',
                });
              }
              return {
                sku: v.sku,
                label: v.label,
                pricePaise: v.pricePaise,
                compareAtPricePaise: compareAt ?? null,
                giftBoxEligible: v.giftBoxEligible ?? true,
                inventory: { create: { onHand: v.onHand ?? 0, reserved: 0 } },
              };
            }),
          },
        },
        include: productInclude,
      });
      return created;
    });

    await this.audit.write({
      actorId,
      action: 'catalog.product.create',
      resource: 'product',
      resourceId: product.id,
      requestId,
    });
    return this.mapProduct(product);
  }

  /** OPS-9 P1 — CSV product create (dry-run validates; commit creates DRAFT then optional publish). */
  async importProducts(input: ProductImportBody, actorId: string, requestId?: string) {
    const results: Array<{
      row: number;
      slug: string;
      sku: string;
      ok: boolean;
      error?: string;
      productId?: string;
    }> = [];

    for (let i = 0; i < input.rows.length; i++) {
      const row = input.rows[i]!;
      const line = i + 1;

      if (row.compareAtPaise != null && row.compareAtPaise < row.pricePaise) {
        results.push({
          row: line,
          slug: row.slug,
          sku: row.sku,
          ok: false,
          error: 'compareAtPaise must be >= pricePaise',
        });
        continue;
      }

      const [slugTaken, skuTaken] = await Promise.all([
        this.prisma.product.findUnique({ where: { slug: row.slug }, select: { id: true } }),
        this.prisma.productVariant.findFirst({
          where: { sku: { equals: row.sku, mode: 'insensitive' } },
          select: { id: true },
        }),
      ]);
      if (slugTaken) {
        results.push({
          row: line,
          slug: row.slug,
          sku: row.sku,
          ok: false,
          error: 'Slug already exists',
        });
        continue;
      }
      if (skuTaken) {
        results.push({
          row: line,
          slug: row.slug,
          sku: row.sku,
          ok: false,
          error: 'SKU already exists',
        });
        continue;
      }

      if (input.dryRun) {
        results.push({ row: line, slug: row.slug, sku: row.sku, ok: true });
        continue;
      }

      try {
        const created = await this.createProduct(
          {
            slug: row.slug,
            title: row.title,
            description: row.description,
            variants: [
              {
                sku: row.sku,
                label: row.label,
                pricePaise: row.pricePaise,
                compareAtPricePaise: row.compareAtPaise ?? null,
                onHand: row.onHand,
              },
            ],
            media: row.imageUrl
              ? [{ url: row.imageUrl, altText: row.title, kind: 'IMAGE' as const }]
              : undefined,
          },
          actorId,
          requestId,
        );
        if (row.status === 'PUBLISHED') {
          await this.publishProduct(created.id, actorId, requestId);
        }
        results.push({
          row: line,
          slug: row.slug,
          sku: row.sku,
          ok: true,
          productId: created.id,
        });
      } catch (e) {
        results.push({
          row: line,
          slug: row.slug,
          sku: row.sku,
          ok: false,
          error: e instanceof Error ? e.message : 'create failed',
        });
      }
    }

    if (!input.dryRun) {
      await this.audit.write({
        actorId,
        action: 'catalog.product.import',
        resource: 'product',
        metadata: {
          dryRun: false,
          total: results.length,
          ok: results.filter((r) => r.ok).length,
          failed: results.filter((r) => !r.ok).length,
        },
        requestId,
      });
    }

    return {
      dryRun: input.dryRun,
      total: results.length,
      okCount: results.filter((r) => r.ok).length,
      errorCount: results.filter((r) => !r.ok).length,
      results,
    };
  }

  async updateProduct(id: string, body: UpdateProductBody, actorId: string, requestId?: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found.' });
    }

    const collectionIds =
      body.collectionSlugs !== undefined
        ? await this.resolveCollectionIds(body.collectionSlugs)
        : undefined;

    const product = await this.prisma.$transaction(async (tx) => {
      if (collectionIds !== undefined) {
        await tx.productCollection.deleteMany({ where: { productId: id } });
        if (collectionIds.length) {
          await tx.productCollection.createMany({
            data: collectionIds.map((collectionId) => ({ productId: id, collectionId })),
          });
        }
      }
      if (body.hamperItems !== undefined) {
        await tx.productHamperItem.deleteMany({ where: { productId: id } });
        if (body.hamperItems?.length) {
          await tx.productHamperItem.createMany({
            data: body.hamperItems.map((item, i) => ({
              productId: id,
              title: item.title,
              blurb: item.blurb ?? null,
              brandName: item.brandName ?? null,
              imageUrl: item.imageUrl ?? null,
              qty: item.qty ?? 1,
              unitPricePaise: item.unitPricePaise,
              sortOrder: item.sortOrder ?? i,
            })),
          });
        }
      }
      if (body.media !== undefined) {
        await tx.productMedia.deleteMany({ where: { productId: id } });
        if (body.media.length) {
          await tx.productMedia.createMany({
            data: body.media.map((m, i) => ({
              productId: id,
              url: m.url,
              altText: m.altText ?? null,
              kind: m.kind ?? 'IMAGE',
              posterUrl: m.posterUrl ?? null,
              sortOrder: m.sortOrder ?? i,
            })),
          });
        }
      }
      return tx.product.update({
        where: { id },
        data: {
          title: body.title,
          description: body.description,
          ...(body.recipientTags !== undefined ? { recipientTags: body.recipientTags } : {}),
          ...(body.ageBands !== undefined ? { ageBands: body.ageBands } : {}),
          ...(body.occasionTags !== undefined ? { occasionTags: body.occasionTags } : {}),
          ...(body.isReadyMadeHamper !== undefined
            ? { isReadyMadeHamper: body.isReadyMadeHamper }
            : {}),
          ...(body.brandName !== undefined ? { brandName: body.brandName } : {}),
          ...(body.storefrontLabels !== undefined
            ? { storefrontLabels: body.storefrontLabels }
            : {}),
          ...(body.seoTitle !== undefined ? { seoTitle: body.seoTitle } : {}),
          ...(body.seoDescription !== undefined ? { seoDescription: body.seoDescription } : {}),
          ...(body.canonicalPath !== undefined ? { canonicalPath: body.canonicalPath } : {}),
          ...(body.ogImageUrl !== undefined ? { ogImageUrl: body.ogImageUrl } : {}),
          ...(body.robotsIndex !== undefined ? { robotsIndex: body.robotsIndex } : {}),
          ...(body.faqItems !== undefined
            ? { faqItems: body.faqItems === null ? Prisma.DbNull : body.faqItems }
            : {}),
          ...(body.seoSections !== undefined
            ? { seoSections: body.seoSections === null ? Prisma.DbNull : body.seoSections }
            : {}),
          ...(body.seoSchemaExtras !== undefined
            ? {
                seoSchemaExtras: seoSchemaExtrasWriteValue(body.seoSchemaExtras, {
                  // PDP always emits FAQPage from faqItems / built-in fallbacks
                  hasSystemFaq: true,
                }),
              }
            : {}),
        },
        include: productInclude,
      });
    });

    await this.audit.write({
      actorId,
      action: 'catalog.product.update',
      resource: 'product',
      resourceId: id,
      requestId,
    });
    return this.mapProduct(product);
  }

  async publishProduct(id: string, actorId: string, requestId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: { include: { inventory: true } } },
    });
    if (!product) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found.' });
    }
    if (!product.variants.length) {
      throw new BadRequestException({
        code: 'NO_VARIANTS',
        message: 'Product needs at least one variant before publish.',
      });
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.PUBLISHED, publishedAt: new Date() },
      include: productInclude,
    });
    await this.audit.write({
      actorId,
      action: 'catalog.product.publish',
      resource: 'product',
      resourceId: id,
      requestId,
    });
    return this.mapProduct(updated);
  }

  async bulkProducts(
    ids: string[],
    action: 'publish' | 'unpublish',
    actorId: string,
    requestId?: string,
  ) {
    const results: Array<{ id: string; ok: boolean; error?: string }> = [];
    for (const id of ids) {
      try {
        if (action === 'publish') {
          await this.publishProduct(id, actorId, requestId);
        } else {
          await this.unpublishProduct(id, actorId, requestId);
        }
        results.push({ id, ok: true });
      } catch (e) {
        results.push({
          id,
          ok: false,
          error: e instanceof Error ? e.message : 'failed',
        });
      }
    }
    await this.audit.write({
      actorId,
      action: `catalog.product.bulk.${action}`,
      resource: 'product',
      metadata: { ids, results },
      requestId,
    });
    return { action, results };
  }

  async unpublishProduct(id: string, actorId: string, requestId?: string) {
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.DRAFT, publishedAt: null },
      include: productInclude,
    });
    await this.audit.write({
      actorId,
      action: 'catalog.product.unpublish',
      resource: 'product',
      resourceId: id,
      requestId,
    });
    return this.mapProduct(updated);
  }

  async updateInventory(variantId: string, onHand: number, actorId: string, requestId?: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true },
    });
    if (!variant) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Variant not found.' });
    }

    // OPS-3: absolute set goes through inventory service (never below reserved + ledger)
    return this.inventory.setOnHandAdmin(variantId, onHand, actorId, requestId);
  }

  async updateVariant(
    variantId: string,
    body: UpdateVariantBody,
    actorId: string,
    requestId?: string,
  ) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Variant not found.' });
    }
    if (body.compareAtPricePaise != null && body.compareAtPricePaise < variant.pricePaise) {
      throw new BadRequestException({
        code: 'INVALID_COMPARE_AT',
        message: 'MRP (compare-at) must be greater than or equal to price.',
      });
    }

    const updated = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { compareAtPricePaise: body.compareAtPricePaise },
    });

    await this.audit.write({
      actorId,
      action: 'catalog.variant.update',
      resource: 'variant',
      resourceId: variantId,
      metadata: { compareAtPricePaise: body.compareAtPricePaise },
      requestId,
    });
    return {
      id: updated.id,
      sku: updated.sku,
      label: updated.label,
      pricePaise: updated.pricePaise,
      compareAtPricePaise: updated.compareAtPricePaise,
      giftBoxEligible: updated.giftBoxEligible,
    };
  }

  /** Product assign + coupon COLLECTION scope — hand-picked joins only. */
  private async resolveCollectionIds(slugs: string[]) {
    if (!slugs.length) return [];
    const cols = await this.prisma.collection.findMany({
      where: { slug: { in: slugs }, membershipMode: 'MANUAL' },
    });
    if (cols.length !== slugs.length) {
      throw new BadRequestException({
        code: 'INVALID_COLLECTION',
        message: 'One or more collection slugs were not found or are Smart (not hand-picked).',
      });
    }
    return cols.map((c) => c.id);
  }

  /** Batch approved-review avg + count onto storefront product DTOs. */
  private async attachReviewSummaries<T extends { id: string }>(
    products: T[],
  ): Promise<Array<T & { averageRating: number | null; reviewCount: number }>> {
    if (products.length === 0) return [];
    const groups = await this.prisma.productReview.groupBy({
      by: ['productId'],
      where: { productId: { in: products.map((p) => p.id) }, status: ReviewStatus.APPROVED },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const byId = new Map(
      groups.map((g) => {
        const avg = g._avg.rating;
        return [
          g.productId,
          {
            averageRating: avg == null ? null : Math.round(Number(avg) * 10) / 10,
            reviewCount: g._count._all,
          },
        ] as const;
      }),
    );
    return products.map((p) => {
      const s = byId.get(p.id);
      return {
        ...p,
        averageRating: s?.averageRating ?? null,
        reviewCount: s?.reviewCount ?? 0,
      };
    });
  }

  mapAdminListProduct(product: Prisma.ProductGetPayload<{ include: typeof adminListInclude }>) {
    const variants = product.variants.map((v) => {
      const onHand = v.inventory?.onHand ?? 0;
      const reserved = v.inventory?.reserved ?? 0;
      return {
        id: v.id,
        sku: v.sku,
        label: v.label,
        pricePaise: v.pricePaise,
        available: Math.max(0, onHand - reserved),
        giftBoxEligible: true as const,
      };
    });
    const fromPricePaise = variants.length ? Math.min(...variants.map((v) => v.pricePaise)) : 0;
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      status: product.status,
      fromPricePaise,
      recipientTags: product.recipientTags,
      occasionTags: product.occasionTags,
      storefrontLabels: (product.storefrontLabels ?? []).filter(isManualStorefrontLabel),
      media: product.media.map((m) => ({
        url: m.url,
        altText: m.altText,
        kind: 'IMAGE' as const,
      })),
      variants,
    };
  }

  mapProduct(product: Prisma.ProductGetPayload<{ include: typeof productInclude }>) {
    const variants = product.variants.map((v) => {
      const onHand = v.inventory?.onHand ?? 0;
      const reserved = v.inventory?.reserved ?? 0;
      return {
        id: v.id,
        sku: v.sku,
        label: v.label,
        pricePaise: v.pricePaise,
        compareAtPricePaise: v.compareAtPricePaise,
        giftBoxEligible: v.giftBoxEligible,
        available: Math.max(0, onHand - reserved),
        onHand,
      };
    });
    const fromPricePaise = variants.length ? Math.min(...variants.map((v) => v.pricePaise)) : 0;
    const sale = saleAnchorPrices(variants);
    const storefrontLabels = (product.storefrontLabels ?? []).filter(isManualStorefrontLabel);
    const displayLabels = resolveStorefrontDisplayLabels({
      publishedAt: product.publishedAt,
      storefrontLabels,
      variants,
    });
    const hamperItems = (product.hamperItems ?? []).map((h) => ({
      id: h.id,
      title: h.title,
      blurb: h.blurb,
      brandName: h.brandName,
      imageUrl: h.imageUrl,
      qty: h.qty,
      unitPricePaise: h.unitPricePaise,
      sortOrder: h.sortOrder,
    }));
    const hamperItemCount = hamperItems.reduce((s, h) => s + h.qty, 0);
    const contentsValuePaise = hamperItems.reduce((s, h) => s + h.unitPricePaise * h.qty, 0);
    const hamperSavingsPaise =
      product.isReadyMadeHamper && hamperItems.length > 0
        ? Math.max(0, contentsValuePaise - fromPricePaise)
        : 0;
    const brandNames = (() => {
      const out: string[] = [];
      const seen = new Set<string>();
      const push = (raw?: string | null) => {
        if (!raw) return;
        for (const part of raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)) {
          const key = part.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(part);
        }
      };
      for (const h of hamperItems) push(h.brandName);
      if (out.length === 0) push(product.brandName);
      return out;
    })();
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      status: product.status,
      publishedAt: product.publishedAt,
      fromPricePaise,
      salePricePaise: sale?.pricePaise ?? null,
      fromCompareAtPaise: sale?.compareAtPaise ?? null,
      recipientTags: product.recipientTags,
      ageBands: product.ageBands,
      occasionTags: product.occasionTags,
      isReadyMadeHamper: product.isReadyMadeHamper,
      brandName: product.brandName,
      brandNames,
      storefrontLabels,
      displayLabels,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      canonicalPath: product.canonicalPath,
      ogImageUrl: product.ogImageUrl,
      robotsIndex: product.robotsIndex,
      faqItems: parseProductFaqItems(product.faqItems),
      seoSections: parseProductSeoSections(product.seoSections),
      seoSchemaExtras: readSeoSchemaExtras(product.seoSchemaExtras),
      hamperItems,
      hamperItemCount,
      contentsValuePaise,
      hamperSavingsPaise,
      collections: product.collections.map((pc) => ({
        slug: pc.collection.slug,
        title: pc.collection.title,
      })),
      media: product.media.map((m) => ({
        id: m.id,
        url: m.url,
        altText: m.altText,
        kind: m.kind === 'VIDEO' ? ('VIDEO' as const) : ('IMAGE' as const),
        posterUrl: m.posterUrl,
        sortOrder: m.sortOrder,
      })),
      personalization: product.personalizationOpts.map((o) => ({
        id: o.id,
        key: o.key,
        label: o.label,
        type: o.type,
        maxLength: o.maxLength,
        options: o.options,
        required: o.required,
      })),
      variants,
    };
  }
}

function parseProductSeoSections(
  raw: unknown,
): Array<{ heading: string; bodyText: string }> | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: Array<{ heading: string; bodyText: string }> = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const headingRaw = (item as { heading?: unknown }).heading;
    const bodyText = (item as { bodyText?: unknown }).bodyText;
    if (typeof bodyText !== 'string' || !bodyText.trim()) continue;
    const heading = typeof headingRaw === 'string' ? headingRaw.trim() : '';
    out.push({ heading, bodyText: bodyText.trim() });
  }
  return out.length ? out : null;
}

function parseProductFaqItems(
  raw: unknown,
): Array<{ question: string; answerText: string }> | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: Array<{ question: string; answerText: string }> = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const q = (item as { question?: unknown }).question;
    const a = (item as { answerText?: unknown }).answerText;
    if (typeof q === 'string' && q.trim() && typeof a === 'string' && a.trim()) {
      out.push({ question: q.trim(), answerText: a.trim() });
    }
  }
  return out.length ? out : null;
}
