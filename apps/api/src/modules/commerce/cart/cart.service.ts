import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CartStatus, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CouponService, type CouponValidateContext } from '../promotions/coupon.service';
import {
  couponLayer,
  formatCouponLabel,
  nestedDiscountPaise,
  type CouponCartLine,
} from '../promotions/coupon-lifecycle';
import { shippingPaise } from '../commerce-pricing';
import { selectBuyNowItems } from './buy-now-slice';
import { assertCartPersonalization } from './assert-cart-personalization';
import { giftExtrasUnitPaise, giftLineFingerprint } from './gift-line-fingerprint';

type GiftExtrasInput = { note?: string; wrapId?: string; ribbonId?: string };
type GiftExtrasSnapshot = {
  note?: { label: string; value: string; pricePaise: number };
  wrap?: { id: string; label: string; pricePaise: number };
  ribbon?: { id: string; label: string; pricePaise: number };
};

function readGiftOptions(raw: unknown) {
  const root =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const choices = (value: unknown) =>
    Array.isArray(value)
      ? value.flatMap((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
          const choice = item as Record<string, unknown>;
          const pricePaise =
            typeof choice.pricePaise === 'number' && Number.isInteger(choice.pricePaise)
              ? Math.max(0, choice.pricePaise)
              : null;
          return typeof choice.id === 'string' &&
            typeof choice.label === 'string' &&
            pricePaise != null
            ? [{ id: choice.id, label: choice.label, pricePaise }]
            : [];
        })
      : [];
  const note =
    root.note && typeof root.note === 'object' && !Array.isArray(root.note)
      ? (root.note as Record<string, unknown>)
      : undefined;
  const notePrice =
    typeof note?.pricePaise === 'number' && Number.isInteger(note.pricePaise)
      ? Math.max(0, note.pricePaise)
      : null;
  return {
    note:
      note?.enabled === true &&
      typeof note.label === 'string' &&
      typeof note.maxLength === 'number' &&
      Number.isInteger(note.maxLength) &&
      note.maxLength > 0 &&
      notePrice != null
        ? {
            label: note.label,
            maxLength: note.maxLength,
            pricePaise: notePrice,
          }
        : undefined,
    wrap: choices(root.wrap),
    ribbon: choices(root.ribbon),
  };
}

function couponLinesFromItems(
  items: Array<{
    productId: string;
    collectionIds: string[];
    lineTotalPaise: number;
    quantity: number;
    onSale: boolean;
    recipientTags: string[];
    ageBands: string[];
    occasionTags: string[];
    isReadyMadeHamper: boolean;
    storefrontLabels: string[];
    brandName: string | null;
    productTitle: string;
  }>,
): CouponCartLine[] {
  return items.map((i) => ({
    productId: i.productId,
    collectionIds: i.collectionIds,
    lineTotalPaise: i.lineTotalPaise,
    quantity: i.quantity,
    onSale: i.onSale,
    recipientTags: i.recipientTags,
    ageBands: i.ageBands,
    occasionTags: i.occasionTags,
    isReadyMadeHamper: i.isReadyMadeHamper,
    storefrontLabels: i.storefrontLabels,
    brandName: i.brandName,
    title: i.productTitle,
  }));
}

function couponFailReason(err: unknown): string {
  if (err instanceof BadRequestException) {
    const body = err.getResponse();
    if (
      typeof body === 'object' &&
      body &&
      'message' in body &&
      typeof (body as { message: unknown }).message === 'string'
    ) {
      return (body as { message: string }).message;
    }
  }
  return 'Coupon no longer valid for this cart.';
}

function stackDtoFields(lineCode: string | null, cartCode: string | null) {
  const couponCodes = [lineCode, cartCode].filter((c): c is string => Boolean(c));
  return {
    lineCouponCode: lineCode,
    cartCouponCode: cartCode,
    couponCodes,
    couponCode: cartCode ?? lineCode,
    couponLabel: formatCouponLabel(lineCode, cartCode),
  };
}

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: {
              collections: true,
              media: {
                where: { kind: 'IMAGE' as const },
                orderBy: { sortOrder: 'asc' as const },
                take: 1,
              },
            },
          },
          inventory: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coupons: CouponService,
  ) {}

  private resolveGiftExtras(
    rawOptions: unknown,
    input?: GiftExtrasInput,
  ): GiftExtrasSnapshot | undefined {
    if (!input) return undefined;
    const options = readGiftOptions(rawOptions);
    const out: GiftExtrasSnapshot = {};
    const note = input.note?.trim();
    if (note) {
      if (!options.note) {
        throw new BadRequestException({
          code: 'GIFT_NOTE_UNAVAILABLE',
          message: 'Gift notes are not available for this product.',
        });
      }
      if (note.length > options.note.maxLength) {
        throw new BadRequestException({
          code: 'GIFT_NOTE_TOO_LONG',
          message: `Gift note must be ${options.note.maxLength} characters or less.`,
        });
      }
      out.note = { label: options.note.label, value: note, pricePaise: options.note.pricePaise };
    }
    for (const [key, choices] of [
      ['wrapId', options.wrap],
      ['ribbonId', options.ribbon],
    ] as const) {
      const id = input[key];
      if (!id) continue;
      const choice = choices.find((candidate) => candidate.id === id);
      if (!choice) {
        throw new BadRequestException({
          code: 'INVALID_GIFT_OPTION',
          message: 'Selected gift option is no longer available.',
        });
      }
      if (key === 'wrapId') out.wrap = choice;
      else out.ribbon = choice;
    }
    return Object.keys(out).length ? out : undefined;
  }

  private giftExtrasPaise(extras: GiftExtrasSnapshot | null | undefined, quantity: number) {
    return giftExtrasUnitPaise(extras) * quantity;
  }

  async getOrCreate(userId?: string, guestToken?: string) {
    if (userId) {
      let cart = await this.prisma.cart.findFirst({
        where: { userId, status: CartStatus.ACTIVE },
        include: cartInclude,
      });
      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId },
          include: cartInclude,
        });
      }
      return this.toCartDto(cart, undefined);
    }

    if (guestToken) {
      const cart = await this.prisma.cart.findFirst({
        where: { guestToken, status: CartStatus.ACTIVE },
        include: cartInclude,
      });
      if (cart) return this.toCartDto(cart, guestToken);
    }

    const token = randomUUID();
    const cart = await this.prisma.cart.create({
      data: { guestToken: token },
      include: cartInclude,
    });
    return this.toCartDto(cart, token);
  }

  async addItem(
    userId: string | undefined,
    guestToken: string | undefined,
    input: {
      variantId: string;
      quantity: number;
      personalization?: Record<string, string>;
      giftExtras?: GiftExtrasInput;
    },
  ) {
    const cartDto = await this.getOrCreate(userId, guestToken);
    const cart = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cartDto.id },
    });

    let addedItemId = '';
    await this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: input.variantId },
        include: {
          product: { include: { personalizationOpts: true } },
          inventory: true,
        },
      });
      if (!variant || variant.product.status !== ProductStatus.PUBLISHED) {
        throw new BadRequestException({
          code: 'INVALID_VARIANT',
          message: 'Product is not available.',
        });
      }
      const personalization = assertCartPersonalization(
        variant.product.personalizationOpts,
        input.personalization,
      );
      await tx.$executeRaw`
        SELECT id FROM inventory_items WHERE variant_id = ${input.variantId}::uuid FOR UPDATE
      `;
      const inv = await tx.inventoryItem.findUnique({
        where: { variantId: input.variantId },
      });
      const available = (inv?.onHand ?? 0) - (inv?.reserved ?? 0);
      const existingItems = await tx.cartItem.findMany({
        where: { cartId: cart.id, variantId: input.variantId },
      });
      const nextQty = existingItems.reduce((sum, item) => sum + item.quantity, 0) + input.quantity;
      if (available < nextQty) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_STOCK',
          message: 'Not enough stock.',
        });
      }
      const giftExtras = this.resolveGiftExtras(variant.product.giftOptions, input.giftExtras);
      const extrasPaise = this.giftExtrasPaise(giftExtras, input.quantity);
      const fingerprint = giftLineFingerprint(personalization, giftExtras);
      const existing = existingItems.find(
        (item) =>
          giftLineFingerprint(
            item.personalization,
            item.giftExtras as GiftExtrasSnapshot | null,
          ) === fingerprint,
      );
      if (existing) {
        const updated = await tx.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: { increment: input.quantity },
            extrasPaise: { increment: extrasPaise },
          },
        });
        addedItemId = updated.id;
      } else {
        const created = await tx.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: input.variantId,
            quantity: input.quantity,
            personalization: personalization ?? undefined,
            giftExtras: giftExtras ?? undefined,
            extrasPaise,
          },
        });
        addedItemId = created.id;
      }
    });

    return {
      ...(await this.getOrCreate(userId, cartDto.guestToken ?? guestToken)),
      lastItemId: addedItemId,
    };
  }

  async updateItem(
    userId: string | undefined,
    guestToken: string | undefined,
    itemId: string,
    quantity: number,
  ) {
    const cartDto = await this.getOrCreate(userId, guestToken);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cartDto.id },
      include: { variant: { include: { inventory: true } } },
    });
    if (!item) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Cart item not found.' });
    }
    const available =
      (item.variant.inventory?.onHand ?? 0) - (item.variant.inventory?.reserved ?? 0);
    const siblingQuantity = await this.prisma.cartItem.aggregate({
      where: {
        cartId: cartDto.id,
        variantId: item.variantId,
        id: { not: itemId },
      },
      _sum: { quantity: true },
    });
    if (available < quantity + (siblingQuantity._sum.quantity ?? 0)) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_STOCK',
        message: 'Not enough stock.',
      });
    }
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        extrasPaise: this.giftExtrasPaise(item.giftExtras as GiftExtrasSnapshot | null, quantity),
      },
    });
    return this.getOrCreate(userId, cartDto.guestToken ?? guestToken);
  }

  async removeItem(userId: string | undefined, guestToken: string | undefined, itemId: string) {
    const cartDto = await this.getOrCreate(userId, guestToken);
    await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cartDto.id },
    });
    return this.getOrCreate(userId, cartDto.guestToken ?? guestToken);
  }

  async applyCoupon(userId: string | undefined, guestToken: string | undefined, code: string) {
    const cartDto = await this.getOrCreate(userId, guestToken);
    const lines = couponLinesFromItems(cartDto.items);
    const ctx: CouponValidateContext = { userId };
    const result = await this.coupons.validate(code, cartDto.subtotalPaise, lines, ctx);
    const layer = couponLayer(result.scope);

    let lineCode = cartDto.lineCouponCode ?? null;
    let cartCode = cartDto.cartCouponCode ?? null;

    if (layer === 'line') {
      lineCode = result.code;
    } else {
      if (lineCode) {
        let lineDiscount = 0;
        try {
          const lineRes = await this.coupons.validate(lineCode, cartDto.subtotalPaise, lines, ctx);
          lineDiscount = lineRes.discountPaise;
        } catch {
          lineCode = null;
        }
        if (lineCode) {
          await this.coupons.validate(code, cartDto.subtotalPaise, lines, {
            ...ctx,
            discountBasePaise: cartDto.subtotalPaise - lineDiscount,
          });
        }
      }
      cartCode = result.code;
    }

    await this.prisma.cart.update({
      where: { id: cartDto.id },
      data: { couponCode: cartCode, lineCouponCode: lineCode },
    });
    return this.getOrCreate(userId, cartDto.guestToken ?? guestToken);
  }

  async removeCoupon(
    userId: string | undefined,
    guestToken: string | undefined,
    code?: string,
  ) {
    const cartDto = await this.getOrCreate(userId, guestToken);
    const target = code?.trim().toUpperCase();
    let lineCode = cartDto.lineCouponCode ?? null;
    let cartCode = cartDto.cartCouponCode ?? null;

    if (!target) {
      lineCode = null;
      cartCode = null;
    } else if (lineCode === target) {
      lineCode = null;
    } else if (cartCode === target) {
      cartCode = null;
    }

    await this.prisma.cart.update({
      where: { id: cartDto.id },
      data: { couponCode: cartCode, lineCouponCode: lineCode },
    });
    return this.getOrCreate(userId, cartDto.guestToken ?? guestToken);
  }

  async mergeGuestIntoUser(userId: string, guestToken: string) {
    const guestCart = await this.prisma.cart.findFirst({
      where: { guestToken, status: CartStatus.ACTIVE },
      include: { items: true },
    });
    if (!guestCart) return this.getOrCreate(userId);

    let userCart = await this.prisma.cart.findFirst({
      where: { userId, status: CartStatus.ACTIVE },
      include: { items: true },
    });
    if (!userCart) {
      userCart = await this.prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    for (const item of guestCart.items) {
      const sameVariant = await this.prisma.cartItem.findMany({
        where: { cartId: userCart.id, variantId: item.variantId },
      });
      const fingerprint = giftLineFingerprint(
        item.personalization,
        item.giftExtras as GiftExtrasSnapshot | null,
      );
      const existing = sameVariant.find(
        (candidate) =>
          giftLineFingerprint(
            candidate.personalization,
            candidate.giftExtras as GiftExtrasSnapshot | null,
          ) === fingerprint,
      );
      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: { increment: item.quantity },
            extrasPaise: { increment: item.extrasPaise },
          },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            variantId: item.variantId,
            quantity: item.quantity,
            personalization: item.personalization ?? undefined,
            giftExtras: item.giftExtras ?? undefined,
            extrasPaise: item.extrasPaise,
          },
        });
      }
    }

    await this.prisma.cart.update({
      where: { id: guestCart.id },
      data: { status: CartStatus.MERGED },
    });

    return this.getOrCreate(userId);
  }

  async totals(
    cartId: string,
    shippingMethod: 'STANDARD' | 'EXPRESS',
    opts?: { buyNowVariantId?: string; buyNowItemId?: string },
  ) {
    const cart = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: cartInclude,
    });
    if (!opts?.buyNowVariantId) {
      const mapped = await this.toCartDto(cart, cart.guestToken ?? undefined);
      const subtotalAfterDiscount = mapped.subtotalPaise - mapped.discountPaise;
      const ship = shippingPaise(shippingMethod, subtotalAfterDiscount);
      return {
        subtotalPaise: mapped.subtotalPaise,
        discountPaise: mapped.discountPaise,
        shippingPaise: ship,
        taxPaise: 0,
        totalPaise: subtotalAfterDiscount + ship,
        couponCode: mapped.cartCouponCode ?? null,
        lineCouponCode: mapped.lineCouponCode ?? null,
        couponCodes: mapped.couponCodes ?? [],
        couponLabel: mapped.couponLabel ?? null,
      };
    }

    const mapped = this.mapCart(cart, cart.guestToken ?? undefined);
    const items = selectBuyNowItems(mapped.items, opts.buyNowVariantId, opts.buyNowItemId);
    if (items.length === 0) {
      throw new BadRequestException({ code: 'EMPTY_CART', message: 'Cart is empty.' });
    }
    const subtotalPaise = items.reduce((s, i) => s + i.lineTotalPaise, 0);
    const quoted = await this.quoteStack({
      cartId: cart.id,
      storedCartCode: mapped.cartCouponCode,
      storedLineCode: mapped.lineCouponCode,
      subtotalPaise,
      lines: couponLinesFromItems(items),
      ctx: { userId: cart.userId, shippingMethod },
      persist: false,
    });
    const subtotalAfterDiscount = subtotalPaise - quoted.discountPaise;
    const ship = shippingPaise(shippingMethod, subtotalAfterDiscount);
    return {
      subtotalPaise,
      discountPaise: quoted.discountPaise,
      shippingPaise: ship,
      taxPaise: 0,
      totalPaise: subtotalAfterDiscount + ship,
      couponCode: quoted.cartCode,
      lineCouponCode: quoted.lineCode,
      couponCodes: quoted.couponCodes,
      couponLabel: quoted.couponLabel,
    };
  }

  /** Cart DTO with live coupon discount (same rules as checkout preview). */
  private async toCartDto(cart: Parameters<CartService['mapCart']>[0], guestToken?: string) {
    const mapped = this.mapCart(cart, guestToken);
    const quoted = await this.quoteStack({
      cartId: cart.id,
      storedCartCode: mapped.cartCouponCode,
      storedLineCode: mapped.lineCouponCode,
      subtotalPaise: mapped.subtotalPaise,
      lines: couponLinesFromItems(mapped.items),
      ctx: { userId: cart.userId },
      persist: true,
    });
    return {
      ...mapped,
      ...stackDtoFields(quoted.lineCode, quoted.cartCode),
      discountPaise: quoted.discountPaise,
      totalPaise: mapped.subtotalPaise - quoted.discountPaise,
      couponRemoved: quoted.stripped,
      couponRemovedReason: quoted.reason,
    };
  }

  private async quoteStack(input: {
    cartId: string;
    storedCartCode: string | null;
    storedLineCode: string | null;
    subtotalPaise: number;
    lines: CouponCartLine[];
    ctx: CouponValidateContext;
    persist: boolean;
  }) {
    let lineCode: string | null = input.storedLineCode;
    let cartCode: string | null = input.storedCartCode;
    let lineDiscount = 0;
    let cartDiscount = 0;
    let stripped = false;
    let reason: string | null = null;

    const tryCode = async (code: string, discountBasePaise?: number) =>
      this.coupons.validate(code, input.subtotalPaise, input.lines, {
        ...input.ctx,
        ...(discountBasePaise != null ? { discountBasePaise } : {}),
      });

    if (lineCode) {
      try {
        const r = await tryCode(lineCode);
        if (couponLayer(r.scope) === 'line') {
          lineDiscount = r.discountPaise;
          lineCode = r.code;
        } else {
          cartCode = cartCode ?? r.code;
          cartDiscount = r.discountPaise;
          lineCode = null;
        }
      } catch (err) {
        lineCode = null;
        stripped = true;
        reason = couponFailReason(err);
      }
    }

    if (cartCode && cartCode !== lineCode) {
      try {
        if (!lineCode) {
          const r = await tryCode(cartCode);
          if (couponLayer(r.scope) === 'line') {
            lineCode = r.code;
            lineDiscount = r.discountPaise;
            cartCode = null;
            cartDiscount = 0;
          } else {
            cartCode = r.code;
            cartDiscount = r.discountPaise;
          }
        } else {
          const remaining = input.subtotalPaise - lineDiscount;
          const r = await tryCode(cartCode, remaining);
          if (couponLayer(r.scope) === 'cart') {
            cartCode = r.code;
            cartDiscount = r.discountPaise;
          } else {
            cartCode = null;
            stripped = true;
            reason = reason ?? 'Coupon no longer valid for this cart.';
          }
        }
      } catch (err) {
        cartCode = null;
        stripped = true;
        reason = reason ?? couponFailReason(err);
      }
    } else if (cartCode && cartCode === lineCode) {
      cartCode = null;
    }

    if (
      input.persist &&
      (cartCode !== input.storedCartCode || lineCode !== input.storedLineCode)
    ) {
      await this.prisma.cart.update({
        where: { id: input.cartId },
        data: { couponCode: cartCode, lineCouponCode: lineCode },
      });
    }

    const couponCodes = [lineCode, cartCode].filter((c): c is string => Boolean(c));
    return {
      lineCode,
      cartCode,
      discountPaise: nestedDiscountPaise(input.subtotalPaise, lineDiscount, cartDiscount),
      couponCodes,
      couponLabel: formatCouponLabel(lineCode, cartCode),
      stripped,
      reason,
    };
  }

  private mapCart(
    cart: {
      id: string;
      userId?: string | null;
      guestToken: string | null;
      couponCode: string | null;
      lineCouponCode?: string | null;
      items: Array<{
        id: string;
        quantity: number;
        personalization: unknown;
        giftExtras: unknown;
        extrasPaise: number;
        variant: {
          id: string;
          sku: string;
          label: string;
          pricePaise: number;
          compareAtPricePaise: number | null;
          product: {
            id: string;
            slug: string;
            title: string;
            status: ProductStatus;
            recipientTags: string[];
            ageBands: string[];
            occasionTags: string[];
            isReadyMadeHamper: boolean;
            storefrontLabels: string[];
            brandName: string | null;
            collections: Array<{ collectionId: string }>;
            media: Array<{ url: string }>;
          };
          inventory: { onHand: number; reserved: number } | null;
        };
      }>;
    },
    guestToken?: string,
  ) {
    const items = cart.items
      .filter((i) => i.variant.product.status === ProductStatus.PUBLISHED)
      .map((i) => {
        const available = (i.variant.inventory?.onHand ?? 0) - (i.variant.inventory?.reserved ?? 0);
        const compareAt = i.variant.compareAtPricePaise;
        return {
          id: i.id,
          variantId: i.variant.id,
          productId: i.variant.product.id,
          collectionIds: i.variant.product.collections.map((c) => c.collectionId),
          productTitle: i.variant.product.title,
          productSlug: i.variant.product.slug,
          imageUrl: i.variant.product.media[0]?.url ?? null,
          sku: i.variant.sku,
          label: i.variant.label,
          quantity: i.quantity,
          unitPricePaise: i.variant.pricePaise,
          extrasPaise: i.extrasPaise,
          lineTotalPaise: i.variant.pricePaise * i.quantity + i.extrasPaise,
          available,
          personalization: i.personalization,
          giftExtras: i.giftExtras,
          onSale: compareAt != null && compareAt > i.variant.pricePaise,
          recipientTags: i.variant.product.recipientTags,
          ageBands: i.variant.product.ageBands,
          occasionTags: i.variant.product.occasionTags,
          isReadyMadeHamper: i.variant.product.isReadyMadeHamper,
          storefrontLabels: i.variant.product.storefrontLabels,
          brandName: i.variant.product.brandName,
        };
      });
    const subtotalPaise = items.reduce((s, i) => s + i.lineTotalPaise, 0);
    return {
      id: cart.id,
      guestToken: guestToken ?? cart.guestToken,
      couponCode: cart.couponCode,
      cartCouponCode: cart.couponCode,
      lineCouponCode: cart.lineCouponCode ?? null,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      subtotalPaise,
      items,
    };
  }
}
