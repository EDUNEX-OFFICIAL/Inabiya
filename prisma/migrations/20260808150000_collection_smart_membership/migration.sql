-- Shopify-style Smart collections: membership mode + condition rules (easy admin builder).

CREATE TYPE "CollectionMembershipMode" AS ENUM ('MANUAL', 'SMART');

ALTER TABLE "collections"
  ADD COLUMN "membership_mode" "CollectionMembershipMode" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "smart_rules" JSONB;

-- Existing rows stay MANUAL (already have product_collections joins).
