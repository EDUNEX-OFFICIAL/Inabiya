import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  cartAddItemBodySchema,
  cartCouponBodySchema,
  cartUpdateItemBodySchema,
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { OptionalJwtAuthGuard } from '../../identity/optional-jwt-auth.guard';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { CartService } from './cart.service';

function guestToken(req: AuthedRequest, header?: string): string | undefined {
  return header?.trim() || undefined;
}

@Controller('cart')
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@Req() req: AuthedRequest, @Headers('x-cart-token') cartHeader?: string) {
    return this.cart.getOrCreate(req.user?.id, guestToken(req, cartHeader));
  }

  @Post('items')
  add(
    @Req() req: AuthedRequest,
    @Headers('x-cart-token') cartHeader: string | undefined,
    @Body(new ZodValidationPipe(cartAddItemBodySchema))
    body: { variantId: string; quantity: number; personalization?: Record<string, string> },
  ) {
    return this.cart.addItem(req.user?.id, guestToken(req, cartHeader), body);
  }

  @Patch('items/:itemId')
  update(
    @Req() req: AuthedRequest,
    @Headers('x-cart-token') cartHeader: string | undefined,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(cartUpdateItemBodySchema)) body: { quantity: number },
  ) {
    return this.cart.updateItem(req.user?.id, guestToken(req, cartHeader), itemId, body.quantity);
  }

  @Delete('items/:itemId')
  remove(
    @Req() req: AuthedRequest,
    @Headers('x-cart-token') cartHeader: string | undefined,
    @Param('itemId') itemId: string,
  ) {
    return this.cart.removeItem(req.user?.id, guestToken(req, cartHeader), itemId);
  }

  @Post('coupon')
  applyCoupon(
    @Req() req: AuthedRequest,
    @Headers('x-cart-token') cartHeader: string | undefined,
    @Body(new ZodValidationPipe(cartCouponBodySchema)) body: { code: string },
  ) {
    return this.cart.applyCoupon(req.user?.id, guestToken(req, cartHeader), body.code);
  }

  @Delete('coupon')
  removeCoupon(
    @Req() req: AuthedRequest,
    @Headers('x-cart-token') cartHeader: string | undefined,
  ) {
    return this.cart.removeCoupon(req.user?.id, guestToken(req, cartHeader));
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  merge(
    @CurrentUser() user: { id: string },
    @Headers('x-cart-token') cartHeader: string,
  ) {
    if (!cartHeader?.trim()) {
      return this.cart.getOrCreate(user.id);
    }
    return this.cart.mergeGuestIntoUser(user.id, cartHeader.trim());
  }
}
