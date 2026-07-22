import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  giftBoxAddItemBodySchema,
  giftBoxCreateBodySchema,
  wishlistAddBodySchema,
} from '@inabiya/validation';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../identity/jwt-auth.guard';
import { CurrentUser } from '../../identity/current-user.decorator';
import { GiftBoxService, WishlistService } from './wishlist-giftbox.service';

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

@Controller('catalog/gift-boxes')
@UseGuards(JwtAuthGuard)
export class GiftBoxController {
  constructor(private readonly giftBoxes: GiftBoxService) {}

  @Get('active')
  active(@CurrentUser() user: { id: string }) {
    return this.giftBoxes.getOrCreateActive(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(giftBoxCreateBodySchema))
    body: {
      name?: string;
      budgetPaise?: number;
      recipient?: string | null;
      ageBand?: string | null;
      occasion?: string | null;
      categorySlugs?: string[];
      wizardStep?: number;
    },
  ) {
    return this.giftBoxes.create(user.id, body);
  }

  @Get(':boxId/recommendations')
  recommendations(@CurrentUser() user: { id: string }, @Param('boxId') boxId: string) {
    return this.giftBoxes.recommendations(boxId, user.id);
  }

  @Post(':boxId/items')
  addItem(
    @CurrentUser() user: { id: string },
    @Param('boxId') boxId: string,
    @Body(new ZodValidationPipe(giftBoxAddItemBodySchema))
    body: { variantId: string; quantity: number; personalization?: Record<string, string> },
  ) {
    return this.giftBoxes.addItem(boxId, user.id, body);
  }

  @Delete(':boxId/items/:itemId')
  removeItem(
    @CurrentUser() user: { id: string },
    @Param('boxId') boxId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.giftBoxes.removeItem(boxId, user.id, itemId);
  }

  @Post(':boxId/move-to-cart')
  moveToCart(@CurrentUser() user: { id: string }, @Param('boxId') boxId: string) {
    return this.giftBoxes.moveToCart(boxId, user.id);
  }
}
