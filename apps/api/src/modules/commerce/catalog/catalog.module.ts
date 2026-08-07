import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { CartModule } from '../cart/cart.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OpsModule } from '../ops/ops.module';
import { CatalogAdminController, CatalogPublicController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import {
  GiftingInquiryAdminController,
  GiftingInquiryPublicController,
} from './gifting-inquiry.controller';
import { GiftingInquiryService } from './gifting-inquiry.service';
import { GiftBoxController, WishlistController } from './wishlist-giftbox.controller';
import { GiftBoxService, WishlistService } from './wishlist-giftbox.service';

@Module({
  imports: [AuditModule, IdentityModule, InventoryModule, OpsModule, forwardRef(() => CartModule)],
  controllers: [
    CatalogPublicController,
    CatalogAdminController,
    WishlistController,
    GiftBoxController,
    GiftingInquiryPublicController,
    GiftingInquiryAdminController,
  ],
  providers: [CatalogService, WishlistService, GiftBoxService, GiftingInquiryService],
  exports: [CatalogService],
})
export class CatalogModule {}
