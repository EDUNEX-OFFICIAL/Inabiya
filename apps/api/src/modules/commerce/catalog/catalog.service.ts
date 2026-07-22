import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import type { CreateCategoryBody, CreateProductBody, UpdateProductBody } from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

const productInclude = {
  variants: { include: { inventory: true }, orderBy: { createdAt: 'asc' as const } },
  media: { orderBy: { sortOrder: 'asc' as const } },
  categories: { include: { category: true } },
  personalizationOpts: { orderBy: { sortOrder: 'asc' as const } },
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
    };

    const products = await this.prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { publishedAt: 'desc' },
    });

    const mapped = products.map((p) => this.mapProduct(p));
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
            create: body.variants.map((v) => ({
              sku: v.sku,
              label: v.label,
              pricePaise: v.pricePaise,
              giftBoxEligible: v.giftBoxEligible ?? true,
              inventory: { create: { onHand: v.onHand ?? 0, reserved: 0 } },
            })),
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
        giftBoxEligible: v.giftBoxEligible,
        available: Math.max(0, onHand - reserved),
        onHand,
      };
    });
    const fromPricePaise = variants.length ? Math.min(...variants.map((v) => v.pricePaise)) : 0;
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
      storefrontLabels: (product.storefrontLabels ?? []).filter(
        (l): l is 'NEW' | 'SALE' => l === 'NEW' || l === 'SALE',
      ),
      categories: product.categories.map((pc) => ({
        slug: pc.category.slug,
        name: pc.category.name,
      })),
      media: product.media.map((m) => ({
        id: m.id,
        url: m.url,
        altText: m.altText,
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
