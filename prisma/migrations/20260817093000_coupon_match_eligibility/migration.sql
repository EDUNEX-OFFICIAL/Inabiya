-- AlterEnum
ALTER TYPE "CouponScope" ADD VALUE 'MATCHING';

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN "match_rules" JSONB;
ALTER TABLE "coupons" ADD COLUMN "eligibility" JSONB;
ALTER TABLE "coupons" ADD COLUMN "max_discount_paise" INTEGER;
ALTER TABLE "coupons" ADD COLUMN "max_uses_per_customer" INTEGER;
