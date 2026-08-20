-- CreateEnum
CREATE TYPE "ArticleRevisionSource" AS ENUM ('AUTO', 'MANUAL', 'META');

-- AlterTable
ALTER TABLE "article_revisions" ADD COLUMN "source" "ArticleRevisionSource" NOT NULL DEFAULT 'AUTO';
