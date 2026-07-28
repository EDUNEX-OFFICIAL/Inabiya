-- Soft Gift leftovers Wave 1: product SEO + per-product FAQs
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "canonical_path" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "og_image_url" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "robots_index" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "faq_items" JSONB;
