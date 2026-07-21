import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartStatus, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CouponService } from '../promotions/coupon.service';
import { shippingPaise } from '../commerce-pricing';

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: true,
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
    input: { variantId: string; quantity: number; personalization?: Record<string, string> },
  ) {
    const cartDto = await this.getOrCreate(userId, guestToken);
    const cart = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cartDto.id },
    });

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: input.variantId },
      include: { product: true, inventory: true },
    });
    if (!variant || variant.product.status !== ProductStatus.PUBLISHED) {
      throw new BadRequestException({
        code: 'INVALID_VARIANT',
        message: 'Product is not available.',
      });
    }
    const available =
      (variant.inventory?.onHand ?? 0) - (variant.inventory?.reserved ?? 0);
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: input.variantId } },
    });
    const nextQty = (existing?.quantity ?? 0) + input.quantity;
    if (available < nextQty) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_STOCK',
        message: 'Not enough stock.',
      });
    }

    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: input.variantId } },
      create: {
        cartId: cart.id,
        variantId: input.variantId,
        quantity: input.quantity,
        personalization: input.personalization ?? undefined,
      },
      update: {
        quantity: { increment: input.quantity },
        personalization: input.personalization ?? undefined,
      },
    });

    return this.getOrCreate(userId, cartDto.guestToken ?? guestToken);
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
    if (available < quantity) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_STOCK',
        message: 'Not enough stock.',
      });
    }
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
    return this.getOrCreate(userId, cartDto.guestToken ?? guestToken);
  }

  async removeItem(
    userId: string | undefined,
    guestToken: string | undefined,
    itemId: string,
  ) {
    const cartDto = await this.getOrCreate(userId, guestToken);
    await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cartDto.id },
    });
    return this.getOrCreate(userId, cartDto.guestToken ?? guestToken);
  }

  async applyCoupon(
    userId: string | undefined,
    guestToken: string | undefined,
    code: string,
  ) {
    const cartDto = await this.getOrCreate(userId, guestToken);
    await this.coupons.validate(code, cartDto.subtotalPaise);
    await this.prisma.cart.update({
      where: { id: cartDto.id },
      data: { couponCode: code.toUpperCase() },
    });
    return this.getOrCreate(userId, cartDto.guestToken ?? guestToken);
  }

  async removeCoupon(userId: string | undefined, guestToken: string | undefined) {
    const cartDto = await this.getOrCreate(userId, guestToken);
    await this.prisma.cart.update({
      where: { id: cartDto.id },
      data: { couponCode: null },
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
      await this.prisma.cartItem.upsert({
        where: {
          cartId_variantId: { cartId: userCart.id, variantId: item.variantId },
        },
        create: {
          cartId: userCart.id,
          variantId: item.variantId,
          quantity: item.quantity,
          personalization: item.personalization ?? undefined,
        },
        update: { quantity: { increment: item.quantity } },
      });
    }

    await this.prisma.cart.update({
      where: { id: guestCart.id },
      data: { status: CartStatus.MERGED },
    });

    return this.getOrCreate(userId);
  }

  async totals(cartId: string, shippingMethod: 'STANDARD' | 'EXPRESS') {
    const cart = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: cartInclude,
    });
    const mapped = await this.toCartDto(cart, cart.guestToken ?? undefined);
    const subtotalAfterDiscount = mapped.subtotalPaise - mapped.discountPaise;
    const ship = shippingPaise(shippingMethod, subtotalAfterDiscount);
    return {
      subtotalPaise: mapped.subtotalPaise,
      discountPaise: mapped.discountPaise,
      shippingPaise: ship,
      taxPaise: 0,
      totalPaise: subtotalAfterDiscount + ship,
      couponCode: cart.couponCode,
    };
  }

  /** Cart DTO with live coupon discount (same rules as checkout preview). */
  private async toCartDto(
    cart: Parameters<CartService['mapCart']>[0],
    guestToken?: string,
  ) {
    const mapped = this.mapCart(cart, guestToken);
    let discountPaise = 0;
    let couponCode = mapped.couponCode;
    let couponRemoved = false;
    let couponRemovedReason: string | null = null;
    if (mapped.couponCode) {
      try {
        const coupon = await this.coupons.validate(mapped.couponCode, mapped.subtotalPaise);
        discountPaise = coupon.discountPaise;
      } catch (err) {
        await this.prisma.cart.update({
          where: { id: cart.id },
          data: { couponCode: null },
        });
        couponCode = null;
        couponRemoved = true;
        couponRemovedReason = 'Coupon no longer valid for this cart.';
        if (err instanceof BadRequestException) {
          const body = err.getResponse();
          if (
            typeof body === 'object' &&
            body &&
            'message' in body &&
            typeof (body as { message: unknown }).message === 'string'
          ) {
            couponRemovedReason = (body as { message: string }).message;
          }
        }
      }
    }
    return {
      ...mapped,
      couponCode,
      discountPaise,
      totalPaise: mapped.subtotalPaise - discountPaise,
      couponRemoved,
      couponRemovedReason,
    };
  }

  private mapCart(
    cart: {
      id: string;
      guestToken: string | null;
      couponCode: string | null;
      items: Array<{
        id: string;
        quantity: number;
        personalization: unknown;
        variant: {
          id: string;
          sku: string;
          label: string;
          pricePaise: number;
          product: { slug: string; title: string; status: ProductStatus };
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
        return {
          id: i.id,
          variantId: i.variant.id,
          productTitle: i.variant.product.title,
          productSlug: i.variant.product.slug,
          sku: i.variant.sku,
          label: i.variant.label,
          quantity: i.quantity,
          unitPricePaise: i.variant.pricePaise,
          lineTotalPaise: i.variant.pricePaise * i.quantity,
          available,
          personalization: i.personalization,
        };
      });
    const subtotalPaise = items.reduce((s, i) => s + i.lineTotalPaise, 0);
    return {
      id: cart.id,
      guestToken: guestToken ?? cart.guestToken,
      couponCode: cart.couponCode,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      subtotalPaise,
      items,
    };
  }
}
