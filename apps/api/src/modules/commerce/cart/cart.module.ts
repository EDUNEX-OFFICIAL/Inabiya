import { Module } from '@nestjs/common';
import { NotificationsQueueModule } from '../../../infrastructure/notifications/notifications-queue.module';
import { IdentityModule } from '../../identity/identity.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { CartAbandonmentScheduler } from './cart-abandonment.scheduler';
import { CartAbandonmentService } from './cart-abandonment.service';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [IdentityModule, PromotionsModule, NotificationsQueueModule],
  controllers: [CartController],
  providers: [CartService, CartAbandonmentService, CartAbandonmentScheduler],
  exports: [CartService, CartAbandonmentService],
})
export class CartModule {}
