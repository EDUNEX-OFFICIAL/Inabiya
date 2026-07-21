-- Phase 6: editorial articles workflow
CREATE TYPE "ArticleStatus" AS ENUM ('ASSIGNED', 'DRAFT', 'SEO_REVIEW', 'MEDICAL_REVIEW', 'CHANGES_REQUESTED', 'APPROVED');
CREATE TYPE "ArticleCommentKind" AS ENUM ('COMMENT', 'CHANGE_REQUEST');

CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "status" "ArticleStatus" NOT NULL DEFAULT 'ASSIGNED',
    "medical_gate_required" BOOLEAN NOT NULL DEFAULT true,
    "assignee_id" UUID,
    "created_by_id" UUID NOT NULL,
    "due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");
CREATE INDEX "articles_status_idx" ON "articles"("status");
CREATE INDEX "articles_assignee_id_idx" ON "articles"("assignee_id");

CREATE TABLE "article_comments" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "kind" "ArticleCommentKind" NOT NULL DEFAULT 'COMMENT',
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "article_comments_article_id_idx" ON "article_comments"("article_id");

CREATE TABLE "article_status_history" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "status" "ArticleStatus" NOT NULL,
    "note" TEXT,
    "actor_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "article_status_history_article_id_idx" ON "article_status_history"("article_id");

ALTER TABLE "articles" ADD CONSTRAINT "articles_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_status_history" ADD CONSTRAINT "article_status_history_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_status_history" ADD CONSTRAINT "article_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
