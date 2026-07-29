import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import type {
  CreateCategoryBody,
  CreateProductBody,
  UpdateProductBody,
  UpdateVariantBody,
} from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  isManualStorefrontLabel,
  resolveStorefrontDisplayLabels,
} from './storefront-display-labels';

const productInclude = {
  variants: { include: { inventory: true }, orderBy: { createdAt: 'asc' as const } },
  media: { orderBy: { sortOrder: 'asc' as const } },
  categories: { include: { category: true } },
  personalizationOpts: { orderBy: { sortOrder: 'asc' as const } },
  hamperItems: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.ProductInclude;

export type ProductDto = ReturnType<CatalogService['mapProduct']>;

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listCategories() {
    const rows = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
    }));
  }

  async createCategory(body: CreateCategoryBody, actorId: string, requestId?: string) {
    const row = await this.prisma.category.create({
      data: {
        slug: body.slug,
        name: body.name,
        description: body.description,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    await this.audit.write({
      actorId,
      action: 'catalog.category.create',
      resource: 'category',
      resourceId: row.id,
      requestId,
    });
    return row;
  }

  async listPublishedProducts(query: {
    q?: string;
    category?: string;
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
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.category ? { categories: { some: { category: { slug: query.category } } } } : {}),
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
      ...(query.storefrontLabel
        ? { storefrontLabels: { has: query.storefrontLabel } }
        : {}),
      ...(query.publishedSince
        ? { publishedAt: { gte: query.publishedSince } }
        : {}),
      ...(query.onSale
        ? { variants: { some: { compareAtPricePaise: { not: null } } } }
        : {}),
    };

    const products = await this.prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { publishedAt: 'desc' },
    });

    let mapped = products.map((p) => this.mapProduct(p));
    if (query.onSale) {
      mapped = mapped.filter((p) =>
        p.variants.some(
          (v) =>
            v.compareAtPricePaise != null && v.compareAtPricePaise > v.pricePaise,
        ),
      );
    }
    if (query.maxPricePaise != null) {
      mapped = mapped.filter((p) => p.fromPricePaise <= query.maxPricePaise!);
    }
    if (query.sort === 'price_asc') {
      mapped.sort((a, b) => a.fromPricePaise - b.fromPricePaise);
    } else if (query.sort === 'price_desc') {
      mapped.sort((a, b) => b.fromPricePaise - a.fromPricePaise);
    }
    return mapped;
  }

  async getPublishedProductBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.PUBLISHED },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found.' });
    }
    return this.mapProduct(product);
  }

  async listAdminProducts() {
    const products = await this.prisma.product.findMany({
      include: productInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return products.map((p) => this.mapProduct(p));
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
    const categoryIds = await this.resolveCategoryIds(body.categorySlugs ?? []);

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
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
          media: body.media?.length
            ? {
                create: body.media.map((m, i) => ({
                  url: m.url,
                  altText: m.altText,
                  sortOrder: m.sortOrder ?? i,
                  kind: 'IMAGE' as const,
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

  async updateProduct(id: string, body: UpdateProductBody, actorId: string, requestId?: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found.' });
    }

    const categoryIds =
      body.categorySlugs !== undefined
        ? await this.resolveCategoryIds(body.categorySlugs)
        : undefined;

    const product = await this.prisma.$transaction(async (tx) => {
      if (categoryIds !== undefined) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        if (categoryIds.length) {
          await tx.productCategory.createMany({
            data: categoryIds.map((categoryId) => ({ productId: id, categoryId })),
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

    const inventory = await this.prisma.inventoryItem.upsert({
      where: { variantId },
      create: { variantId, onHand, reserved: 0 },
      update: { onHand },
    });

    await this.audit.write({
      actorId,
      action: 'catalog.inventory.update',
      resource: 'variant',
      resourceId: variantId,
      metadata: { onHand },
      requestId,
    });
    return inventory;
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

  private async resolveCategoryIds(slugs: string[]) {
    if (!slugs.length) return [];
    const cats = await this.prisma.category.findMany({ where: { slug: { in: slugs } } });
    if (cats.length !== slugs.length) {
      throw new BadRequestException({
        code: 'INVALID_CATEGORY',
        message: 'One or more category slugs were not found.',
      });
    }
    return cats.map((c) => c.id);
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
        for (const part of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
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
      hamperItems,
      hamperItemCount,
      contentsValuePaise,
      hamperSavingsPaise,
      categories: product.categories.map((pc) => ({
        slug: pc.category.slug,
        name: pc.category.name,
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
    const heading = (item as { heading?: unknown }).heading;
    const bodyText = (item as { bodyText?: unknown }).bodyText;
    if (typeof heading === 'string' && heading.trim() && typeof bodyText === 'string' && bodyText.trim()) {
      out.push({ heading: heading.trim(), bodyText: bodyText.trim() });
    }
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
