-- Guest Build Your Box (cart-like token). Login only required at checkout.

ALTER TABLE "gift_boxes" ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "gift_boxes" ADD COLUMN IF NOT EXISTS "guest_token" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "gift_boxes_guest_token_key" ON "gift_boxes"("guest_token");
