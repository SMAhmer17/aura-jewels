-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('unread', 'read', 'resolved');

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "email" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "verifiedBuyer" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "orderNumber" TEXT,
    "message" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'unread',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactMessage_status_createdAt_idx" ON "ContactMessage"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_productId_email_key" ON "Review"("productId", "email");

-- The new table gets the same lockdown as every other table: Supabase's public API can read or write nothing.
ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "ContactMessage" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "ContactMessage" FROM authenticated;
  END IF;
END $$;

-- Keep obviously bad data out at the database level too.
ALTER TABLE "Review" ADD CONSTRAINT "review_email_lower" CHECK ("email" IS NULL OR "email" = lower("email"));
ALTER TABLE "ContactMessage" ADD CONSTRAINT "message_not_empty" CHECK (length(trim("message")) > 0);
