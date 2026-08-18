-- CreateEnum
CREATE TYPE "MediaVariantsStatus" AS ENUM ('PENDING', 'READY', 'SKIPPED', 'FAILED');

-- AlterTable
ALTER TABLE "media_assets" ADD COLUMN "width" INTEGER,
ADD COLUMN "height" INTEGER,
ADD COLUMN "web_storage_key" TEXT,
ADD COLUMN "thumb_storage_key" TEXT,
ADD COLUMN "blur_data_url" VARCHAR(2048),
ADD COLUMN "variants_status" "MediaVariantsStatus" NOT NULL DEFAULT 'PENDING';
