-- AlterTable
ALTER TABLE "marketing_pages" ADD COLUMN "canonical_path" TEXT;
ALTER TABLE "marketing_pages" ADD COLUMN "og_image_url" TEXT;
ALTER TABLE "marketing_pages" ADD COLUMN "robots_index" BOOLEAN NOT NULL DEFAULT true;
