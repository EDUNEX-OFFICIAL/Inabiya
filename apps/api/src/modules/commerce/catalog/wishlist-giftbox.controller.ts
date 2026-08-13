import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  giftBoxAddItemBodySchema,
  giftBoxCreateBodySchema,
  wishlistAddBodySchema,
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard, type AuthedRequest } from '../../identity/jwt-auth.guard';
import { OptionalJwtRefreshGuard } from '../../identity/optional-jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { GiftBoxService, WishlistService } from './wishlist-giftbox.service';
import { giftBoxOwnerWhere, type GiftBoxActor } from './gift-box-owner';

@Controller('catalog/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.wishlist.list(user.id);
  }

  @Post()
  add(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(wishlistAddBodySchema)) body: { variantId: string },
  ) {
    return this.wishlist.add(user.id, body.variantId);
  }

  @Delete(':variantId')
  remove(@CurrentUser() user: { id: string }, @Param('variantId') variantId: string) {
    return this.wishlist.remove(user.id, variantId);
  }
}

function giftBoxActor(req: AuthedRequest, header?: string): GiftBoxActor {
  return { userId: req.user?.id, guestToken: header?.trim() || undefined };
}

@Controller('catalog/gift-boxes')
@UseGuards(OptionalJwtRefreshGuard)
export class GiftBoxController {
  constructor(private readonly giftBoxes: GiftBoxService) {}

  @Get('active')
  active(@Req() req: AuthedRequest, @Headers('x-gift-box-token') boxHeader?: string) {
    return this.giftBoxes.getOrCreateActive(giftBoxActor(req, boxHeader));
  }

  @Post('reset')
  reset(@Req() req: AuthedRequest, @Headers('x-gift-box-token') boxHeader?: string) {
    return this.giftBoxes.reset(giftBoxActor(req, boxHeader));
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  merge(@CurrentUser() user: { id: string }, @Headers('x-gift-box-token') boxHeader?: string) {
    const owner = giftBoxOwnerWhere({ guestToken: boxHeader });
    if (!owner || !('guestToken' in owner)) {
      return this.giftBoxes.getOrCreateActive({ userId: user.id });
    }
    return this.giftBoxes.mergeGuestIntoUser(user.id, owner.guestToken);
  }

  @Post()
  create(
    @Req() req: AuthedRequest,
    @Headers('x-gift-box-token') boxHeader: string | undefined,
    @Body(new ZodValidationPipe(giftBoxCreateBodySchema))
    body: {
      name?: string;
      budgetPaise?: number;
      recipient?: string | null;
      ageBand?: string | null;
      occasion?: string | null;
      collectionSlugs?: string[];
      wizardStep?: number;
    },
  ) {
    return this.giftBoxes.create(giftBoxActor(req, boxHeader), body);
  }

  @Get(':boxId/recommendations')
  recommendations(
    @Req() req: AuthedRequest,
    @Headers('x-gift-box-token') boxHeader: string | undefined,
    @Param('boxId', ParseUUIDPipe) boxId: string,
  ) {
    return this.giftBoxes.recommendations(boxId, giftBoxActor(req, boxHeader));
  }

  @Post(':boxId/items')
  addItem(
    @Req() req: AuthedRequest,
    @Headers('x-gift-box-token') boxHeader: string | undefined,
    @Param('boxId', ParseUUIDPipe) boxId: string,
    @Body(new ZodValidationPipe(giftBoxAddItemBodySchema))
    body: { variantId: string; quantity: number; personalization?: Record<string, string> },
  ) {
    return this.giftBoxes.addItem(boxId, giftBoxActor(req, boxHeader), body);
  }

  @Delete(':boxId/items/:itemId')
  removeItem(
    @Req() req: AuthedRequest,
    @Headers('x-gift-box-token') boxHeader: string | undefined,
    @Param('boxId', ParseUUIDPipe) boxId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.giftBoxes.removeItem(boxId, giftBoxActor(req, boxHeader), itemId);
  }

  @Post(':boxId/move-to-cart')
  moveToCart(
    @Req() req: AuthedRequest,
    @Headers('x-gift-box-token') boxHeader: string | undefined,
    @Headers('x-cart-token') cartHeader: string | undefined,
    @Param('boxId', ParseUUIDPipe) boxId: string,
  ) {
    return this.giftBoxes.moveToCart(
      boxId,
      giftBoxActor(req, boxHeader),
      cartHeader?.trim() || undefined,
    );
  }
}
