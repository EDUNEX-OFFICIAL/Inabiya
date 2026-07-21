-- Phase 8: Creator Collective marketplace
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'OPEN', 'REVIEWING', 'AWARDED', 'IN_DELIVERY', 'COMPLETED', 'CANCELLED', 'CLOSED');
CREATE TYPE "ProposalStatus" AS ENUM ('SUBMITTED', 'REJECTED', 'AWARDED', 'WITHDRAWN');
CREATE TYPE "DeliverableStatus" AS ENUM ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED');
CREATE TYPE "CampaignPaymentStatus" AS ENUM ('PENDING', 'RELEASED', 'CANCELLED');

CREATE TABLE "creator_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "niches" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "portfolio_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "creator_profiles_user_id_key" ON "creator_profiles"("user_id");
CREATE UNIQUE INDEX "creator_profiles_slug_key" ON "creator_profiles"("slug");

CREATE TABLE "brand_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "bio" TEXT,
    "website_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "brand_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "brand_profiles_user_id_key" ON "brand_profiles"("user_id");
CREATE UNIQUE INDEX "brand_profiles_slug_key" ON "brand_profiles"("slug");

CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brief" TEXT NOT NULL DEFAULT '',
    "budget_paise" INTEGER NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "winner_proposal_id" UUID,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");
CREATE UNIQUE INDEX "campaigns_winner_proposal_id_key" ON "campaigns"("winner_proposal_id");
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");
CREATE INDEX "campaigns_brand_id_idx" ON "campaigns"("brand_id");

CREATE TABLE "proposals" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "pitch" TEXT NOT NULL,
    "bid_paise" INTEGER NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'SUBMITTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "proposals_campaign_id_creator_id_key" ON "proposals"("campaign_id", "creator_id");
CREATE INDEX "proposals_creator_id_idx" ON "proposals"("creator_id");
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

CREATE TABLE "campaign_messages" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "campaign_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "campaign_messages_campaign_id_created_at_idx" ON "campaign_messages"("campaign_id", "created_at");

CREATE TABLE "deliverables" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "notes" TEXT,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'SUBMITTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "deliverables_campaign_id_idx" ON "deliverables"("campaign_id");
CREATE INDEX "deliverables_proposal_id_idx" ON "deliverables"("proposal_id");

CREATE TABLE "campaign_payments" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "status" "CampaignPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "released_at" TIMESTAMP(3),
    "released_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "campaign_payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "campaign_payments_campaign_id_key" ON "campaign_payments"("campaign_id");
CREATE INDEX "campaign_payments_status_idx" ON "campaign_payments"("status");

CREATE TABLE "campaign_ratings" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "campaign_ratings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "campaign_ratings_campaign_id_author_id_key" ON "campaign_ratings"("campaign_id", "author_id");
CREATE INDEX "campaign_ratings_campaign_id_idx" ON "campaign_ratings"("campaign_id");

ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_winner_proposal_id_fkey" FOREIGN KEY ("winner_proposal_id") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_payments" ADD CONSTRAINT "campaign_payments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_ratings" ADD CONSTRAINT "campaign_ratings_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_ratings" ADD CONSTRAINT "campaign_ratings_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
