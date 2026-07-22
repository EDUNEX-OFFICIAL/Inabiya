import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { buildGiftBoxProductWhere, REC_FILTER_TIERS } from './gift-box-recommendations';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const rows = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        variant: {
          include: {
            product: { include: { media: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
            inventory: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      variantId: r.variantId,
      product: {
        slug: r.variant.product.slug,
        title: r.variant.product.title,
        imageUrl: r.variant.product.media[0]?.url ?? null,
      },
      sku: r.variant.sku,
      label: r.variant.label,
      pricePaise: r.variant.pricePaise,
      available: Math.max(
        0,
        (r.variant.inventory?.onHand ?? 0) - (r.variant.inventory?.reserved ?? 0),
      ),
    }));
  }

  async add(userId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant || variant.product.status !== ProductStatus.PUBLISHED) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Variant not available.' });
    }
    return this.prisma.wishlistItem.upsert({
      where: { userId_variantId: { userId, variantId } },
      create: { userId, variantId },
      update: {},
    });
  }

  async remove(userId: string, variantId: string) {
    await this.prisma.wishlistItem.deleteMany({ where: { userId, variantId } });
    return { ok: true };
  }
}

@Injectable()
export class GiftBoxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
  ) {}

  async getOrCreateActive(userId: string) {
    let box = await this.prisma.giftBox.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                inventory: true,
              },
            },
          },
        },
      },
    });
    if (!box) {
      box = await this.prisma.giftBox.create({
        data: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true, inventory: true },
              },
            },
          },
        },
      });
    }
    return this.mapBox(box);
  }

  async create(
    userId: string,
    input: {
      name?: string;
      budgetPaise?: number;
      recipient?: string | null;
      ageBand?: string | null;
      occasion?: string | null;
      categorySlugs?: string[];
      wizardStep?: number;
    },
  ) {
    const active = await this.prisma.giftBox.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        items: { include: { variant: true } },
      },
    });
    if (active && input.budgetPaise != null) {
      const subtotal = active.items.reduce((s, i) => s + i.variant.pricePaise * i.quantity, 0);
      if (input.budgetPaise < subtotal) {
        throw new BadRequestException({
          code: 'BUDGET_TOO_LOW',
          message: `Budget must be at least ₹${(subtotal / 100).toFixed(0)} (current box subtotal).`,
        });
      }
    }
    const prefs = {
      ...(input.name ? { name: input.name } : {}),
      ...(input.budgetPaise != null ? { budgetPaise: input.budgetPaise } : {}),
      ...(input.recipient !== undefined ? { recipient: input.recipient } : {}),
      ...(input.ageBand !== undefined ? { ageBand: input.ageBand } : {}),
      ...(input.occasion !== undefined ? { occasion: input.occasion } : {}),
      ...(input.categorySlugs !== undefined ? { categorySlugs: input.categorySlugs } : {}),
      ...(input.wizardStep != null ? { wizardStep: input.wizardStep } : {}),
    };
    if (active) {
      const box = await this.prisma.giftBox.update({
        where: { id: active.id },
        data: prefs,
        include: {
          items: {
            include: {
              variant: { include: { product: true, inventory: true } },
            },
          },
        },
      });
      return this.mapBox(box);
    }
    const box = await this.prisma.giftBox.create({
      data: {
        userId,
        name: input.name ?? 'My gift box',
        budgetPaise: input.budgetPaise,
        recipient: input.recipient ?? undefined,
        ageBand: input.ageBand ?? undefined,
        occasion: input.occasion ?? undefined,
        categorySlugs: input.categorySlugs ?? [],
        wizardStep: input.wizardStep ?? 1,
      },
      include: {
        items: {
          include: {
            variant: { include: { product: true, inventory: true } },
          },
        },
      },
    });
    return this.mapBox(box);
  }

  /** Recommend gift-box-eligible variants matching prefs and remaining budget. */
  async recommendations(boxId: string, userId: string) {
    const mapped = await this.getBox(boxId, userId);
    const remaining = Math.max(
      0,
      mapped.remainingBudgetPaise ?? mapped.budgetPaise ?? Number.MAX_SAFE_INTEGER,
    );
    const inBox = new Set(mapped.items.map((i) => i.variantId));
    const prefs = {
      recipient: mapped.recipient,
      ageBand: mapped.ageBand,
      occasion: mapped.occasion,
      categorySlugs: mapped.categorySlugs,
    };

    type Suggestion = {
      variantId: string;
      productSlug: string;
      productTitle: string;
      label: string;
      pricePaise: number;
      imageUrl: string | null;
      available: number;
    };

    const collect = (
      products: Array<{
        slug: string;
        title: string;
        media: Array<{ url: string }>;
        variants: Array<{
          id: string;
          giftBoxEligible: boolean;
          label: string;
          pricePaise: number;
          inventory: { onHand: number; reserved: number } | null;
        }>;
      }>,
    ): Suggestion[] => {
      const out: Suggestion[] = [];
      for (const p of products) {
        for (const v of p.variants) {
          if (!v.giftBoxEligible || inBox.has(v.id)) continue;
          const available = Math.max(0, (v.inventory?.onHand ?? 0) - (v.inventory?.reserved ?? 0));
          if (available < 1) continue;
          if (v.pricePaise > remaining) continue;
          out.push({
            variantId: v.id,
            productSlug: p.slug,
            productTitle: p.title,
            label: v.label,
            pricePaise: v.pricePaise,
            imageUrl: p.media[0]?.url ?? null,
            available,
          });
        }
      }
      out.sort((a, b) => a.pricePaise - b.pricePaise);
      return out;
    };

    let suggestions: Suggestion[] = [];
    for (const tier of REC_FILTER_TIERS) {
      const products = await this.prisma.product.findMany({
        where: buildGiftBoxProductWhere(prefs, tier),
        include: {
          variants: { include: { inventory: true } },
          media: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
        take: 40,
        orderBy: { publishedAt: 'desc' },
      });
      suggestions = collect(products);
      if (suggestions.length) break;
    }

    return {
      remainingBudgetPaise: mapped.remainingBudgetPaise,
      suggestions: suggestions.slice(0, 12),
    };
  }

  /** Clear items + prefs and return wizard to step 1. */
  async reset(userId: string) {
    const active = await this.prisma.giftBox.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    if (!active) {
      return this.getOrCreateActive(userId);
    }
    await this.prisma.$transaction([
      this.prisma.giftBoxItem.deleteMany({ where: { giftBoxId: active.id } }),
      this.prisma.giftBox.update({
        where: { id: active.id },
        data: {
          recipient: null,
          ageBand: null,
          occasion: null,
          budgetPaise: null,
          categorySlugs: [],
          wizardStep: 1,
          name: 'My gift box',
        },
      }),
    ]);
    return this.getBox(active.id, userId);
  }

  async addItem(
    boxId: string,
    userId: string,
    input: { variantId: string; quantity: number; personalization?: Record<string, string> },
  ) {
    const box = await this.prisma.giftBox.findFirst({
      where: { id: boxId, userId },
      include: {
        items: { include: { variant: true } },
      },
    });
    if (!box) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Gift box not found.' });
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: input.variantId },
      include: { product: true, inventory: true },
    });
    if (
      !variant ||
      !variant.giftBoxEligible ||
      variant.product.status !== ProductStatus.PUBLISHED
    ) {
      throw new BadRequestException({
        code: 'NOT_ELIGIBLE',
        message: 'Variant is not eligible for gift box.',
      });
    }
    const available = (variant.inventory?.onHand ?? 0) - (variant.inventory?.reserved ?? 0);
    if (available < input.quantity) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_STOCK',
        message: 'Not enough stock for this item.',
      });
    }

    if (box.budgetPaise != null) {
      const current = box.items.reduce((s, i) => s + i.variant.pricePaise * i.quantity, 0);
      const next = current + variant.pricePaise * input.quantity;
      if (next > box.budgetPaise) {
        throw new BadRequestException({
          code: 'OVER_BUDGET',
          message: `This item would put the box over budget by ₹${((next - box.budgetPaise) / 100).toFixed(0)}. Raise budget or remove something first.`,
        });
      }
    }

    await this.prisma.giftBoxItem.create({
      data: {
        giftBoxId: boxId,
        variantId: input.variantId,
        quantity: input.quantity,
        personalization: input.personalization,
      },
    });

    return this.getBox(boxId, userId);
  }

  async getBox(boxId: string, userId: string) {
    const box = await this.prisma.giftBox.findFirst({
      where: { id: boxId, userId },
      include: {
        items: {
          include: {
            variant: { include: { product: true, inventory: true } },
          },
        },
      },
    });
    if (!box) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Gift box not found.' });
    }
    return this.mapBox(box);
  }

  async removeItem(boxId: string, userId: string, itemId: string) {
    const box = await this.prisma.giftBox.findFirst({ where: { id: boxId, userId } });
    if (!box) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Gift box not found.' });
    }
    await this.prisma.giftBoxItem.deleteMany({ where: { id: itemId, giftBoxId: boxId } });
    return this.getBox(boxId, userId);
  }

  /** Copy all gift-box lines into the user cart, then clear the box. */
  async moveToCart(boxId: string, userId: string) {
    const mapped = await this.getBox(boxId, userId);
    if (mapped.items.length === 0) {
      throw new BadRequestException({
        code: 'EMPTY_BOX',
        message: 'Gift box is empty.',
      });
    }
    if ((mapped.overBudgetPaise ?? 0) > 0) {
      throw new BadRequestException({
        code: 'OVER_BUDGET',
        message: `Box is over budget by ₹${((mapped.overBudgetPaise ?? 0) / 100).toFixed(0)}. Raise budget or remove items before moving to cart.`,
      });
    }
    for (const item of mapped.items) {
      const personalization =
        item.personalization &&
        typeof item.personalization === 'object' &&
        !Array.isArray(item.personalization)
          ? (item.personalization as Record<string, string>)
          : undefined;
      await this.cart.addItem(userId, undefined, {
        variantId: item.variantId,
        quantity: item.quantity,
        personalization,
      });
    }
    await this.prisma.$transaction([
      this.prisma.giftBoxItem.deleteMany({ where: { giftBoxId: boxId } }),
      this.prisma.giftBox.update({
        where: { id: boxId },
        data: {
          recipient: null,
          ageBand: null,
          occasion: null,
          budgetPaise: null,
          categorySlugs: [],
          wizardStep: 1,
        },
      }),
    ]);
    const cart = await this.cart.getOrCreate(userId);
    const box = await this.getBox(boxId, userId);
    return { cart, box };
  }

  private mapBox(
    box: NonNullable<
      Awaited<
        ReturnType<
          typeof this.prisma.giftBox.findFirst<{
            include: {
              items: {
                include: {
                  variant: { include: { product: true; inventory: true } };
                };
              };
            };
          }>
        >
      >
    >,
  ) {
    const items = box.items.map((i) => ({
      id: i.id,
      variantId: i.variant.id,
      sku: i.variant.sku,
      label: i.variant.label,
      productTitle: i.variant.product.title,
      productSlug: i.variant.product.slug,
      pricePaise: i.variant.pricePaise,
      quantity: i.quantity,
      lineTotalPaise: i.variant.pricePaise * i.quantity,
      personalization: i.personalization,
    }));
    const subtotalPaise = items.reduce((s, i) => s + i.lineTotalPaise, 0);
    const budgetPaise = box.budgetPaise;
    const remainingBudgetPaise = budgetPaise != null ? budgetPaise - subtotalPaise : null;
    const overBudgetPaise =
      budgetPaise != null && subtotalPaise > budgetPaise ? subtotalPaise - budgetPaise : 0;
    return {
      id: box.id,
      name: box.name,
      budgetPaise,
      recipient: box.recipient,
      ageBand: box.ageBand,
      occasion: box.occasion,
      categorySlugs: box.categorySlugs,
      wizardStep: box.wizardStep,
      subtotalPaise,
      remainingBudgetPaise,
      overBudgetPaise,
      items,
    };
  }
}
