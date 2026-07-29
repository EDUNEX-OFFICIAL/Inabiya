-- Hamper display BOM + media kind/video + SEO sections on products
CREATE TYPE "ProductMediaKind" AS ENUM ('IMAGE', 'VIDEO');

ALTER TABLE "products" ADD COLUMN "seo_sections" JSONB;

ALTER TABLE "product_media" ADD COLUMN "kind" "ProductMediaKind" NOT NULL DEFAULT 'IMAGE';
ALTER TABLE "product_media" ADD COLUMN "poster_url" TEXT;

CREATE TABLE "product_hamper_items" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "blurb" TEXT,
    "image_url" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unit_price_paise" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_hamper_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_hamper_items_product_id_idx" ON "product_hamper_items"("product_id");

ALTER TABLE "product_hamper_items" ADD CONSTRAINT "product_hamper_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
