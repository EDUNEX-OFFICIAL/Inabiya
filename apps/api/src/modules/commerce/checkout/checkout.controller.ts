import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  checkoutPlaceOrderBodySchema,
  checkoutPreviewBodySchema,
  mockPaymentWebhookBodySchema,
  razorpayPaymentVerifyBodySchema,
  razorpayWebhookBodySchema,
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SensitivePostRateLimitGuard } from '../../../common/guards/rate-limit.guard';
import { matchesRazorpaySignature } from '../../../infrastructure/payments/razorpay-signature';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { CheckoutService } from './checkout.service';
import { PaymentFulfillmentService } from './payment-fulfillment.service';

@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkout: CheckoutService,
    private readonly fulfillment: PaymentFulfillmentService,
  ) {}

  @Get('shipping-methods')
  shippingMethods() {
    return this.checkout.shippingMethods();
  }

  @Post('preview')
  @UseGuards(JwtAuthGuard)
  preview(
    @CurrentUser() user: { id: string },
    @Headers('x-cart-token') cartHeader: string | undefined,
    @Body(new ZodValidationPipe(checkoutPreviewBodySchema))
    body: {
      shippingMethod: 'STANDARD' | 'EXPRESS';
      couponCode?: string;
      buyNowVariantId?: string;
      buyNowItemId?: string;
    },
  ) {
    return this.checkout.preview(user.id, cartHeader?.trim(), body);
  }

  @Post('place-order')
  @UseGuards(JwtAuthGuard, SensitivePostRateLimitGuard)
  placeOrder(
    @CurrentUser() user: { id: string },
    @Headers('x-cart-token') cartHeader: string | undefined,
    @Body(new ZodValidationPipe(checkoutPlaceOrderBodySchema))
    body: Parameters<CheckoutService['placeOrder']>[2],
    @Req() req: AuthedRequest,
  ) {
    return this.checkout.placeOrder(user.id, cartHeader?.trim(), body, String(req.id ?? ''));
  }

  @Post('payments/:paymentId/confirm')
  @UseGuards(JwtAuthGuard)
  confirmPayment(@CurrentUser() user: { id: string }, @Param('paymentId') paymentId: string) {
    return this.fulfillment.confirmMockPayment(paymentId, user.id);
  }

  @Post('payments/:paymentId/razorpay/verify')
  @UseGuards(JwtAuthGuard, SensitivePostRateLimitGuard)
  verifyRazorpayPayment(
    @CurrentUser() user: { id: string },
    @Param('paymentId') paymentId: string,
    @Body(new ZodValidationPipe(razorpayPaymentVerifyBodySchema))
    body: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    },
  ) {
    return this.fulfillment.confirmRazorpayPayment(paymentId, user.id, body);
  }
}

@Controller('webhooks/payments')
export class PaymentWebhookController {
  constructor(private readonly fulfillment: PaymentFulfillmentService) {}

  @Post('mock')
  mockWebhook(
    @Headers('x-webhook-secret') secret: string | undefined,
    @Body(new ZodValidationPipe(mockPaymentWebhookBodySchema))
    body: { eventId: string; paymentId: string; status: 'CAPTURED' | 'FAILED' },
  ) {
    const expected = (process.env.PAYMENT_WEBHOOK_SECRET ?? '').trim();
    if (!expected) {
      throw new UnauthorizedException({
        code: 'WEBHOOK_LOCKED',
        message: 'Mock payment webhook is locked. Set PAYMENT_WEBHOOK_SECRET.',
      });
    }
    if (secret !== expected) {
      throw new ForbiddenException({
        code: 'WEBHOOK_FORBIDDEN',
        message: 'Invalid webhook secret.',
      });
    }
    return this.fulfillment.processWebhook({
      provider: 'mock',
      eventId: body.eventId,
      paymentId: body.paymentId,
      status: body.status,
      payload: body,
    });
  }

  @Post('razorpay')
  razorpayWebhook(
    @Headers('x-razorpay-signature') signature: string | undefined,
    @Req() req: { rawBody?: Buffer },
    @Body(new ZodValidationPipe(razorpayWebhookBodySchema))
    body: {
      event: 'payment.captured' | 'payment.failed';
      payload: { payment: { entity: { id: string; notes?: Record<string, string> } } };
    },
  ) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    const rawBody = req.rawBody;
    if (!secret || !signature || !rawBody) {
      throw new UnauthorizedException({
        code: 'WEBHOOK_LOCKED',
        message: 'Razorpay webhook is not configured.',
      });
    }
    if (!matchesRazorpaySignature(rawBody, signature, secret)) {
      throw new ForbiddenException({
        code: 'WEBHOOK_FORBIDDEN',
        message: 'Invalid Razorpay webhook signature.',
      });
    }
    const paymentId = body.payload.payment.entity.notes?.paymentId;
    if (!paymentId) {
      throw new BadRequestException({
        code: 'INVALID_WEBHOOK',
        message: 'Razorpay webhook is missing payment context.',
      });
    }
    return this.fulfillment.processWebhook({
      provider: 'razorpay',
      eventId: `${body.event}-${body.payload.payment.entity.id}`,
      paymentId,
      status: body.event === 'payment.captured' ? 'CAPTURED' : 'FAILED',
      providerPaymentId: body.payload.payment.entity.id,
      payload: body,
    });
  }
}
