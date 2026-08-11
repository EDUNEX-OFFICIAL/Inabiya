-- CreateEnum
CREATE TYPE "CustomerCommunicationChannel" AS ENUM ('EMAIL', 'SMS', 'INTERNAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CustomerCommunicationStatus" AS ENUM ('LOGGED', 'SKIPPED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "customer_communication_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" "CustomerCommunicationChannel" NOT NULL,
    "template_key" TEXT NOT NULL,
    "subject" TEXT,
    "status" "CustomerCommunicationStatus" NOT NULL DEFAULT 'LOGGED',
    "metadata" JSONB,
    "actor_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_communication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_communication_logs_user_id_created_at_idx" ON "customer_communication_logs"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "customer_communication_logs" ADD CONSTRAINT "customer_communication_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_communication_logs" ADD CONSTRAINT "customer_communication_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
