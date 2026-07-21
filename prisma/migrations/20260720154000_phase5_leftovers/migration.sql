-- Phase 5 leftovers: analytics + cart abandonment marker
ALTER TABLE "carts" ADD COLUMN "abandonment_notified_at" TIMESTAMP(3);
CREATE INDEX "carts_status_updated_at_idx" ON "carts"("status", "updated_at");

CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "session_id" TEXT,
    "user_id" UUID,
    "path" TEXT,
    "product_id" UUID,
    "order_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_events_name_created_at_idx" ON "analytics_events"("name", "created_at");
CREATE INDEX "analytics_events_session_id_idx" ON "analytics_events"("session_id");
