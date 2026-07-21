-- CreateEnum
CREATE TYPE "MarketingPageStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "marketing_pages" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "MarketingPageStatus" NOT NULL DEFAULT 'DRAFT',
    "seo_title" TEXT,
    "seo_description" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "marketing_pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketing_pages_slug_key" ON "marketing_pages"("slug");
CREATE INDEX "marketing_pages_status_idx" ON "marketing_pages"("status");

CREATE TABLE "page_blocks" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "props" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "page_blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "page_blocks_page_id_sort_order_idx" ON "page_blocks"("page_id", "sort_order");

ALTER TABLE "page_blocks" ADD CONSTRAINT "page_blocks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "marketing_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
