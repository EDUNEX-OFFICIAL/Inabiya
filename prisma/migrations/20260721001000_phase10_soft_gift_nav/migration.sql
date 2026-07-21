-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "recipient_tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "age_bands" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "occasion_tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_ready_made_hamper" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand_name" TEXT;

CREATE INDEX IF NOT EXISTS "products_is_ready_made_hamper_idx" ON "products"("is_ready_made_hamper");

-- AlterTable gift_boxes
ALTER TABLE "gift_boxes" ADD COLUMN IF NOT EXISTS "recipient" TEXT;
ALTER TABLE "gift_boxes" ADD COLUMN IF NOT EXISTS "age_band" TEXT;
ALTER TABLE "gift_boxes" ADD COLUMN IF NOT EXISTS "occasion" TEXT;
ALTER TABLE "gift_boxes" ADD COLUMN IF NOT EXISTS "category_slugs" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "gift_boxes" ADD COLUMN IF NOT EXISTS "wizard_step" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE IF NOT EXISTS "gifting_inquiries" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "message" TEXT NOT NULL,
    "estimated_qty" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gifting_inquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "gifting_inquiries_status_idx" ON "gifting_inquiries"("status");
CREATE INDEX IF NOT EXISTS "gifting_inquiries_type_idx" ON "gifting_inquiries"("type");
