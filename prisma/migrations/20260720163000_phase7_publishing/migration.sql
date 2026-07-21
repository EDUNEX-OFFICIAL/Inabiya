-- Phase 7: publishing, SEO, taxonomy, specialists, writer payments, newsletter
ALTER TYPE "ArticleStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';
ALTER TYPE "ArticleStatus" ADD VALUE IF NOT EXISTS 'PUBLISHED';

CREATE TABLE "editorial_categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "editorial_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "editorial_categories_slug_key" ON "editorial_categories"("slug");

CREATE TABLE "article_tags" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "article_tags_slug_key" ON "article_tags"("slug");

CREATE TABLE "specialist_profiles" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "credentials" TEXT,
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "specialist_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "specialist_profiles_slug_key" ON "specialist_profiles"("slug");
CREATE UNIQUE INDEX "specialist_profiles_user_id_key" ON "specialist_profiles"("user_id");

ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "category_id" UUID;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "specialist_id" UUID;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "canonical_path" TEXT;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "og_image_url" TEXT;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP(3);
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3);
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "view_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "articles_scheduled_at_idx" ON "articles"("scheduled_at");
CREATE INDEX IF NOT EXISTS "articles_published_at_idx" ON "articles"("published_at");

CREATE TABLE "article_tags_on_articles" (
    "article_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    CONSTRAINT "article_tags_on_articles_pkey" PRIMARY KEY ("article_id","tag_id")
);

CREATE TYPE "WriterPaymentStatus" AS ENUM ('PENDING', 'RELEASED', 'CANCELLED');

CREATE TABLE "writer_payments" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "writer_id" UUID NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "status" "WriterPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "released_at" TIMESTAMP(3),
    "released_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "writer_payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "writer_payments_article_id_key" ON "writer_payments"("article_id");
CREATE INDEX "writer_payments_status_idx" ON "writer_payments"("status");
CREATE INDEX "writer_payments_writer_id_idx" ON "writer_payments"("writer_id");

CREATE TABLE "newsletter_signups" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "newsletter_signups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "newsletter_signups_email_key" ON "newsletter_signups"("email");

ALTER TABLE "specialist_profiles" ADD CONSTRAINT "specialist_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "editorial_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "articles" ADD CONSTRAINT "articles_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "specialist_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "article_tags_on_articles" ADD CONSTRAINT "article_tags_on_articles_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_tags_on_articles" ADD CONSTRAINT "article_tags_on_articles_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "article_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "writer_payments" ADD CONSTRAINT "writer_payments_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "writer_payments" ADD CONSTRAINT "writer_payments_writer_id_fkey" FOREIGN KEY ("writer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "writer_payments" ADD CONSTRAINT "writer_payments_released_by_id_fkey" FOREIGN KEY ("released_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
