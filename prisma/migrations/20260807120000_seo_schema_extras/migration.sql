-- Admin Schema.org extras (presets + custom JSON-LD) on SEO surfaces
ALTER TABLE "products" ADD COLUMN "seo_schema_extras" JSONB;
ALTER TABLE "articles" ADD COLUMN "seo_schema_extras" JSONB;
ALTER TABLE "marketing_pages" ADD COLUMN "seo_schema_extras" JSONB;
