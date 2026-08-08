-- Collections are join-only (drop RULES membership). SEO fields for PLP metadata.
-- Prerequisite: RULES rows materialized into product_collections (see scripts/materialize-collection-rules.ts).

ALTER TABLE "collections" DROP COLUMN IF EXISTS "membership_mode";
ALTER TABLE "collections" DROP COLUMN IF EXISTS "rules";
DROP TYPE IF EXISTS "CollectionMembershipMode";

ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "canonical_path" TEXT;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "og_image_url" TEXT;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "robots_index" BOOLEAN NOT NULL DEFAULT true;
