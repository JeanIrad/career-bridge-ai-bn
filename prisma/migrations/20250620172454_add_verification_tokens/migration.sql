/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `VerificationCode` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "VerificationCode" ADD COLUMN     "isUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "token" TEXT,
ALTER COLUMN "code" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "VerificationCode_token_key" ON "VerificationCode"("token");
