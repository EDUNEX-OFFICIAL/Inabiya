-- Phase 5: returns + RETURNED order status
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RETURNED';

CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED');

CREATE TABLE "return_requests" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "admin_note" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "return_requests_order_id_idx" ON "return_requests"("order_id");
CREATE INDEX "return_requests_status_idx" ON "return_requests"("status");
CREATE INDEX "return_requests_user_id_idx" ON "return_requests"("user_id");

ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Default configurable return window (days after delivery)
INSERT INTO "commerce_settings" ("key", "value", "updated_at")
VALUES ('policy.return_window_days', '14'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
