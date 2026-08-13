import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { giftBoxAccessWhere, giftBoxOwnerWhere, type GiftBoxActor } from './gift-box-owner';
import { buildGiftBoxProductWhere, REC_FILTER_TIERS } from './gift-box-recommendations';

const giftBoxInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: { include: { media: { orderBy: { sortOrder: 'asc' as const }, take: 1 } } },
          inventory: true,
        },
      },
    },
  },
};

type GiftBoxLoaded = {
  id: string;
  name: string;
  budgetPaise: number | null;
  recipient: string | null;
  ageBand: string | null;
  occasion: string | null;
  collectionSlugs: string[];
  wizardStep: number;
  guestToken: string | null;
  items: Array<{
    id: string;
    quantity: number;
    personalization: unknown;
    variant: {
      id: string;
      sku: string;
      label: string;
      pricePaise: number;
      product: {
        title: string;
        slug: string;
        brandName: string | null;
        media: Array<{ url: string }>;
      };
    };
  }>;
};

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

  async getOrCreateActive(actor: GiftBoxActor) {
    const owner = giftBoxOwnerWhere(actor);
    if (owner) {
      const existing = await this.prisma.giftBox.findFirst({
        where: owner,
        orderBy: { updatedAt: 'desc' },
        include: giftBoxInclude,
      });
      if (existing) return this.mapBox(existing as GiftBoxLoaded);
    }

    const validGuest = actor.userId ? null : giftBoxOwnerWhere({ guestToken: actor.guestToken });
    const guestToken = actor.userId
      ? undefined
      : validGuest && 'guestToken' in validGuest
        ? validGuest.guestToken
        : randomUUID();
    try {
      const box = await this.prisma.giftBox.create({
        data: actor.userId ? { userId: actor.userId } : { guestToken },
        include: giftBoxInclude,
      });
      return this.mapBox(box as GiftBoxLoaded);
    } catch (e) {
      if (guestToken && e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const raced = await this.prisma.giftBox.findFirst({
          where: { guestToken },
          include: giftBoxInclude,
        });
        if (raced) return this.mapBox(raced as GiftBoxLoaded);
      }
      throw e;
    }
  }

  async create(
    actor: GiftBoxActor,
    input: {
      name?: string;
      budgetPaise?: number;
      recipient?: string | null;
      ageBand?: string | null;
      occasion?: string | null;
      collectionSlugs?: string[];
      wizardStep?: number;
    },
  ) {
    const active = await this.requireActive(actor);
    if (input.budgetPaise != null) {
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
      ...(input.collectionSlugs !== undefined ? { collectionSlugs: input.collectionSlugs } : {}),
      ...(input.wizardStep != null ? { wizardStep: input.wizardStep } : {}),
    };
    const box = await this.prisma.giftBox.update({
      where: { id: active.id },
      data: prefs,
      include: giftBoxInclude,
    });
    return this.mapBox(box as GiftBoxLoaded);
  }

  /** Recommend gift-box-eligible variants matching prefs and remaining budget. */
  async recommendations(boxId: string, actor: GiftBoxActor) {
    const mapped = await this.getBox(boxId, actor);
    const remaining = Math.max(
      0,
      mapped.remainingBudgetPaise ?? mapped.budgetPaise ?? Number.MAX_SAFE_INTEGER,
    );
    const inBox = new Set(mapped.items.map((i) => i.variantId));
    const prefs = {
      recipient: mapped.recipient,
      ageBand: mapped.ageBand,
      occasion: mapped.occasion,
      collectionSlugs: mapped.collectionSlugs,
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
  async reset(actor: GiftBoxActor) {
    const owner = giftBoxOwnerWhere(actor);
    if (!owner) {
      return this.getOrCreateActive(actor);
    }
    const active = await this.prisma.giftBox.findFirst({
      where: owner,
      orderBy: { updatedAt: 'desc' },
    });
    if (!active) {
      return this.getOrCreateActive(actor);
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
          collectionSlugs: [],
          wizardStep: 1,
          name: 'My gift box',
        },
      }),
    ]);
    return this.getBox(active.id, actor);
  }

  async addItem(
    boxId: string,
    actor: GiftBoxActor,
    input: { variantId: string; quantity: number; personalization?: Record<string, string> },
  ) {
    const access = giftBoxAccessWhere(boxId, actor);
    if (!access) {
      throw new BadRequestException({ code: 'NO_OWNER', message: 'Gift box session missing.' });
    }
    const box = await this.prisma.giftBox.findFirst({
      where: access,
      include: { items: { include: { variant: true } } },
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

    return this.getBox(boxId, actor);
  }

  async getBox(boxId: string, actor: GiftBoxActor) {
    const access = giftBoxAccessWhere(boxId, actor);
    if (!access) {
      throw new BadRequestException({ code: 'NO_OWNER', message: 'Gift box session missing.' });
    }
    const box = await this.prisma.giftBox.findFirst({
      where: access,
      include: giftBoxInclude,
    });
    if (!box) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Gift box not found.' });
    }
    return this.mapBox(box as GiftBoxLoaded);
  }

  async removeItem(boxId: string, actor: GiftBoxActor, itemId: string) {
    const access = giftBoxAccessWhere(boxId, actor);
    if (!access) {
      throw new BadRequestException({ code: 'NO_OWNER', message: 'Gift box session missing.' });
    }
    const box = await this.prisma.giftBox.findFirst({ where: access });
    if (!box) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Gift box not found.' });
    }
    await this.prisma.giftBoxItem.deleteMany({ where: { id: itemId, giftBoxId: boxId } });
    return this.getBox(boxId, actor);
  }

  /** Copy all gift-box lines into the actor cart, then clear the box. */
  async moveToCart(boxId: string, actor: GiftBoxActor, cartGuestToken?: string) {
    const mapped = await this.getBox(boxId, actor);
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
      await this.cart.addItem(actor.userId, cartGuestToken, {
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
          collectionSlugs: [],
          wizardStep: 1,
        },
      }),
    ]);
    const cart = await this.cart.getOrCreate(actor.userId, cartGuestToken);
    const box = await this.getBox(boxId, actor);
    return { cart, box };
  }

  /** Attach guest box to the signed-in user (login/register). */
  async mergeGuestIntoUser(userId: string, guestToken: string) {
    const token = guestToken.trim();
    const guestBox = token
      ? await this.prisma.giftBox.findFirst({
          where: { guestToken: token },
          include: giftBoxInclude,
        })
      : null;
    if (!guestBox) {
      return this.getOrCreateActive({ userId });
    }

    const userBox = await this.prisma.giftBox.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: giftBoxInclude,
    });

    if (!userBox) {
      await this.prisma.giftBox.update({
        where: { id: guestBox.id },
        data: { userId, guestToken: null },
      });
      return this.getBox(guestBox.id, { userId });
    }

    const guestLoaded = guestBox as GiftBoxLoaded;
    const userHasProgress =
      userBox.wizardStep > 1 ||
      userBox.items.length > 0 ||
      Boolean(
        userBox.recipient || userBox.ageBand || userBox.occasion || userBox.budgetPaise != null,
      );
    const guestHasProgress =
      guestLoaded.wizardStep > 1 ||
      guestLoaded.items.length > 0 ||
      Boolean(
        guestLoaded.recipient ||
        guestLoaded.ageBand ||
        guestLoaded.occasion ||
        guestLoaded.budgetPaise != null,
      );

    if (!userHasProgress && guestHasProgress) {
      await this.prisma.$transaction([
        this.prisma.giftBoxItem.deleteMany({ where: { giftBoxId: userBox.id } }),
        this.prisma.giftBox.delete({ where: { id: userBox.id } }),
        this.prisma.giftBox.update({
          where: { id: guestBox.id },
          data: { userId, guestToken: null },
        }),
      ]);
      return this.getBox(guestBox.id, { userId });
    }

    const inUser = new Set(userBox.items.map((i) => i.variant.id));
    for (const item of guestLoaded.items) {
      if (inUser.has(item.variant.id)) continue;
      await this.prisma.giftBoxItem.create({
        data: {
          giftBoxId: userBox.id,
          variantId: item.variant.id,
          quantity: item.quantity,
          personalization:
            item.personalization && typeof item.personalization === 'object'
              ? (item.personalization as object)
              : undefined,
        },
      });
    }

    await this.prisma.giftBox.update({
      where: { id: userBox.id },
      data: {
        recipient: userBox.recipient ?? guestLoaded.recipient,
        ageBand: userBox.ageBand ?? guestLoaded.ageBand,
        occasion: userBox.occasion ?? guestLoaded.occasion,
        budgetPaise:
          userBox.budgetPaise != null || guestLoaded.budgetPaise != null
            ? Math.max(userBox.budgetPaise ?? 0, guestLoaded.budgetPaise ?? 0)
            : null,
        collectionSlugs: userBox.collectionSlugs.length
          ? userBox.collectionSlugs
          : guestLoaded.collectionSlugs,
        wizardStep: Math.max(userBox.wizardStep, guestLoaded.wizardStep),
      },
    });

    await this.prisma.giftBox.delete({ where: { id: guestBox.id } });
    return this.getBox(userBox.id, { userId });
  }

  private async requireActive(actor: GiftBoxActor) {
    const owner = giftBoxOwnerWhere(actor);
    if (owner) {
      const existing = await this.prisma.giftBox.findFirst({
        where: owner,
        orderBy: { updatedAt: 'desc' },
        include: { items: { include: { variant: true } } },
      });
      if (existing) return existing;
    }
    const created = await this.getOrCreateActive(actor);
    const reloaded = await this.prisma.giftBox.findFirst({
      where: { id: created.id },
      include: { items: { include: { variant: true } } },
    });
    if (!reloaded) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Gift box not found.' });
    }
    return reloaded;
  }

  private mapBox(box: GiftBoxLoaded) {
    const items = box.items.map((i) => ({
      id: i.id,
      variantId: i.variant.id,
      sku: i.variant.sku,
      label: i.variant.label,
      productTitle: i.variant.product.title,
      productSlug: i.variant.product.slug,
      brandName: i.variant.product.brandName,
      imageUrl: i.variant.product.media[0]?.url ?? null,
      pricePaise: i.variant.pricePaise,
      quantity: i.quantity,
      lineTotalPaise: i.variant.pricePaise * i.quantity,
      personalization: i.personalization,
    }));
    const brandNames = (() => {
      const out: string[] = [];
      const seen = new Set<string>();
      for (const i of items) {
        const raw = i.brandName?.trim();
        if (!raw) continue;
        const key = raw.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(raw);
      }
      return out;
    })();
    const subtotalPaise = items.reduce((s, i) => s + i.lineTotalPaise, 0);
    const budgetPaise = box.budgetPaise;
    const remainingBudgetPaise = budgetPaise != null ? budgetPaise - subtotalPaise : null;
    const overBudgetPaise =
      budgetPaise != null && subtotalPaise > budgetPaise ? subtotalPaise - budgetPaise : 0;
    return {
      id: box.id,
      name: box.name,
      guestToken: box.guestToken,
      budgetPaise,
      recipient: box.recipient,
      ageBand: box.ageBand,
      occasion: box.occasion,
      collectionSlugs: box.collectionSlugs,
      wizardStep: box.wizardStep,
      subtotalPaise,
      remainingBudgetPaise,
      overBudgetPaise,
      brandNames,
      items,
    };
  }
}
