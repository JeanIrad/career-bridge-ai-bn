/*
  Warnings:

  - Added the required column `recipientId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- First, add all columns except recipientId
ALTER TABLE "Message" ADD COLUMN     "attachments" TEXT[],
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "editHistory" JSONB,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "replyToId" TEXT,
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'SENT';

-- Add recipientId with a temporary default
ALTER TABLE "Message" ADD COLUMN "recipientId" TEXT;

-- Update existing messages to set recipientId to the first participant that isn't the sender
UPDATE "Message" m
SET "recipientId" = (
  SELECT p.id 
  FROM "User" p 
  INNER JOIN "Chat" c ON c.id = m."chatId"
  WHERE p.id = ANY(c.participants) 
  AND p.id != m."senderId"
  LIMIT 1
);

-- Now make recipientId required
ALTER TABLE "Message" ALTER COLUMN "recipientId" SET NOT NULL;

-- Create indexes
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX "Message_recipientId_idx" ON "Message"("recipientId");
CREATE INDEX "Message_chatId_idx" ON "Message"("chatId");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- Add foreign keys
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
