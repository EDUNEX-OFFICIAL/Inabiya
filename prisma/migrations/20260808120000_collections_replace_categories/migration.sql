-- Soft Gift: replace commerce categories with hybrid collections (MANUAL | RULES).

CREATE TYPE "CollectionStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "CollectionMembershipMode" AS ENUM ('MANUAL', 'RULES');

CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "overline" TEXT,
    "hero_image_url" TEXT,
    "hero_image_alt" TEXT,
    "accent" TEXT NOT NULL DEFAULT 'neutral',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "CollectionStatus" NOT NULL DEFAULT 'DRAFT',
    "membership_mode" "CollectionMembershipMode" NOT NULL DEFAULT 'MANUAL',
    "rules" JSONB,
    "related_slugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "locked_label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");
CREATE INDEX "collections_status_sort_order_idx" ON "collections"("status", "sort_order");

CREATE TABLE "product_collections" (
    "product_id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_collections_pkey" PRIMARY KEY ("product_id","collection_id")
);

CREATE INDEX "product_collections_collection_id_idx" ON "product_collections"("collection_id");

ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE IF EXISTS "product_categories";
DROP TABLE IF EXISTS "categories";

ALTER TABLE "gift_boxes" RENAME COLUMN "category_slugs" TO "collection_slugs";

-- Coupons: retire CATEGORY scope (reset to CART); add collection_ids
ALTER TABLE "coupons" ADD COLUMN "collection_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "coupons" SET "scope" = 'CART'::"CouponScope" WHERE "scope"::text = 'CATEGORY';

ALTER TYPE "CouponScope" RENAME TO "CouponScope_old";
CREATE TYPE "CouponScope" AS ENUM ('CART', 'PRODUCT', 'COLLECTION');
ALTER TABLE "coupons" ALTER COLUMN "scope" DROP DEFAULT;
ALTER TABLE "coupons" ALTER COLUMN "scope" TYPE "CouponScope" USING (
  CASE
    WHEN "scope"::text = 'PRODUCT' THEN 'PRODUCT'::"CouponScope"
    ELSE 'CART'::"CouponScope"
  END
);
ALTER TABLE "coupons" ALTER COLUMN "scope" SET DEFAULT 'CART'::"CouponScope";
DROP TYPE "CouponScope_old";

ALTER TABLE "coupons" DROP COLUMN IF EXISTS "category_ids";
