import {
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
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { SensitivePostRateLimitGuard } from '../../../common/guards/rate-limit.guard';
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
    body: { shippingMethod: 'STANDARD' | 'EXPRESS'; couponCode?: string },
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
}
