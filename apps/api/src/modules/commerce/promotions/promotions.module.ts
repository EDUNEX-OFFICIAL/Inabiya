import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { CouponService } from './coupon.service';

@Module({
  imports: [AuditModule],
  providers: [CouponService],
  exports: [CouponService],
})
export class PromotionsModule {}
