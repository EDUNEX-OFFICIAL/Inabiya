-- AlterTable
ALTER TABLE "products" ADD COLUMN "storefront_labels" TEXT[] DEFAULT ARRAY[]::TEXT[];
