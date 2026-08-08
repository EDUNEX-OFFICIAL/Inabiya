-- CreateEnum
CREATE TYPE "CouponScope" AS ENUM ('CART', 'PRODUCT', 'CATEGORY');

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN "scope" "CouponScope" NOT NULL DEFAULT 'CART';
ALTER TABLE "coupons" ADD COLUMN "product_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "coupons" ADD COLUMN "category_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
