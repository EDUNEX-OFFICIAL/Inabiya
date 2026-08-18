import { BadRequestException, Injectable } from '@nestjs/common';
import { CartStatus, OrderStatus } from '@prisma/client';
import type { CheckoutPlaceOrderBody } from '@inabiya/validation';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { PaymentsService } from '../../../infrastructure/payments/payments.service';
import { AuditService } from '../../audit/audit.service';
import { convertCartAfterBuyNow, selectBuyNowItems } from '../cart/buy-now-slice';
import { CartService } from '../cart/cart.service';
import { generateOrderNumber } from '../commerce-pricing';
import { InventoryService } from '../inventory/inventory.service';
import { CouponService } from '../promotions/coupon.service';
import { AddressService } from '../customers/address.service';
import { CustomerAdminService } from '../customers/customer-admin.service';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
    private readonly inventory: InventoryService,
    private readonly coupons: CouponService,
    private readonly payments: PaymentsService,
    private readonly addresses: AddressService,
    private readonly audit: AuditService,
    private readonly customers: CustomerAdminService,
  ) {}

  shippingMethods() {
    return [
      { code: 'STANDARD', label: 'Standard (3–5 days)', fromPaise: 0 },
      { code: 'EXPRESS', label: 'Express (1–2 days)', fromPaise: 19_900 },
    ];
  }

  async preview(
    userId: string | undefined,
    guestToken: string | undefined,
    input: {
      shippingMethod: 'STANDARD' | 'EXPRESS';
      couponCode?: string;
      buyNowVariantId?: string;
      buyNowItemId?: string;
    },
  ) {
    const cartDto = await this.cart.getOrCreate(userId, guestToken);
    const items = selectBuyNowItems(cartDto.items, input.buyNowVariantId, input.buyNowItemId);
    if (items.length === 0) {
      throw new BadRequestException({ code: 'EMPTY_CART', message: 'Cart is empty.' });
    }
    const stacked = new Set((cartDto.couponCodes ?? []).map((c) => c.toUpperCase()));
    if (input.couponCode && !stacked.has(input.couponCode.toUpperCase())) {
      await this.cart.applyCoupon(userId, guestToken, input.couponCode);
    }
    return this.cart.totals(cartDto.id, input.shippingMethod, {
      buyNowVariantId: input.buyNowVariantId,
      buyNowItemId: input.buyNowItemId,
    });
  }

  async placeOrder(
    userId: string,
    guestToken: string | undefined,
    body: CheckoutPlaceOrderBody,
    requestId?: string,
  ) {
    await this.customers.assertActiveForCheckout(userId);

    const cartDto = await this.cart.getOrCreate(userId, guestToken);
    const items = selectBuyNowItems(cartDto.items, body.buyNowVariantId, body.buyNowItemId);
    if (items.length === 0) {
      throw new BadRequestException({ code: 'EMPTY_CART', message: 'Cart is empty.' });
    }

    const couponCode = body.couponCode ?? undefined;
    const stacked = new Set((cartDto.couponCodes ?? []).map((c) => c.toUpperCase()));
    if (couponCode && !stacked.has(couponCode.toUpperCase())) {
      await this.cart.applyCoupon(userId, guestToken, couponCode);
    }

    const totals = await this.cart.totals(cartDto.id, body.shippingMethod, {
      buyNowVariantId: body.buyNowVariantId,
      buyNowItemId: body.buyNowItemId,
    });
    const reserveItems = items.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
    }));
    await this.inventory.assertAvailable(reserveItems);

    if (body.saveAddress) {
      await this.addresses.create(userId, body.shippingAddress);
    }

    const orderNumber = generateOrderNumber();
    const shippingAddress = body.shippingAddress as object;
    const billingAddress = (body.billingAddress ?? body.shippingAddress) as object;

    const result = await this.prisma.$transaction(async (tx) => {
      await this.inventory.reserve(tx, reserveItems);

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: OrderStatus.PENDING_PAYMENT,
          subtotalPaise: totals.subtotalPaise,
          discountPaise: totals.discountPaise,
          shippingPaise: totals.shippingPaise,
          taxPaise: totals.taxPaise,
          totalPaise: totals.totalPaise,
          couponCode: totals.couponCode,
          lineCouponCode: totals.lineCouponCode,
          shippingMethod: body.shippingMethod,
          giftMessage: body.giftMessage,
          giftWrap: body.giftWrap ?? false,
          shippingAddress,
          billingAddress,
          statusHistory: {
            create: {
              status: OrderStatus.PENDING_PAYMENT,
              note: 'Order placed',
            },
          },
          items: {
            create: items.map((item) => ({
              variantId: item.variantId,
              sku: item.sku,
              title: item.productTitle,
              label: item.label,
              unitPricePaise: item.unitPricePaise,
              quantity: item.quantity,
              lineTotalPaise: item.lineTotalPaise,
              personalization: item.personalization ?? undefined,
              giftExtras: item.giftExtras ?? undefined,
              extrasPaise: item.extrasPaise,
            })),
          },
        },
        include: { items: true },
      });

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: process.env.PAYMENT_PROVIDER || 'mock',
          amountPaise: order.totalPaise,
          status: 'PENDING',
          idempotencyKey: `order-${order.id}`,
        },
      });

      if (body.buyNowItemId || body.buyNowVariantId) {
        await tx.cartItem.deleteMany({
          where: body.buyNowItemId
            ? { id: body.buyNowItemId, cartId: cartDto.id }
            : { cartId: cartDto.id, variantId: body.buyNowVariantId },
        });
        const remaining = await tx.cartItem.count({ where: { cartId: cartDto.id } });
        if (convertCartAfterBuyNow(remaining)) {
          await tx.cart.update({
            where: { id: cartDto.id },
            data: { status: CartStatus.CONVERTED },
          });
        }
      } else {
        await tx.cart.update({
          where: { id: cartDto.id },
          data: { status: CartStatus.CONVERTED },
        });
      }

      return { order, payment };
    });

    const intent = await this.payments.createIntent({
      paymentId: result.payment.id,
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      amountPaise: result.order.totalPaise,
    });

    await this.audit.write({
      actorId: userId,
      action: 'order.placed',
      resource: 'order',
      resourceId: result.order.id,
      metadata: { orderNumber, totalPaise: result.order.totalPaise },
      requestId,
    });

    return {
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      totalPaise: result.order.totalPaise,
      ...intent,
    };
  }
}
