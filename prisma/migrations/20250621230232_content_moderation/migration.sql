-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('POST', 'COMMENT', 'MESSAGE', 'PROFILE', 'DOCUMENT', 'IMAGE', 'VIDEO', 'JOB_POSTING', 'COMPANY_DESCRIPTION', 'USER_BIO', 'REVIEW');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED', 'UNDER_REVIEW', 'AUTO_APPROVED', 'AUTO_REJECTED');

-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'INAPPROPRIATE_CONTENT', 'COPYRIGHT_VIOLATION', 'FAKE_INFORMATION', 'VIOLENCE', 'ADULT_CONTENT', 'DISCRIMINATION', 'SCAM', 'OFF_TOPIC', 'DUPLICATE_CONTENT');

-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "ModerationRequest" (
    "id" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "reporterId" TEXT,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "severity" "SeverityLevel" NOT NULL DEFAULT 'LOW',
    "violationTypes" "ViolationType"[],
    "moderatorId" TEXT,
    "moderatorNotes" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ModerationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModerationRequest_status_idx" ON "ModerationRequest"("status");

-- CreateIndex
CREATE INDEX "ModerationRequest_contentType_idx" ON "ModerationRequest"("contentType");

-- CreateIndex
CREATE INDEX "ModerationRequest_severity_idx" ON "ModerationRequest"("severity");

-- CreateIndex
CREATE INDEX "ModerationRequest_createdAt_idx" ON "ModerationRequest"("createdAt");

-- CreateIndex
CREATE INDEX "ModerationRequest_authorId_idx" ON "ModerationRequest"("authorId");

-- CreateIndex
CREATE INDEX "ModerationRequest_moderatorId_idx" ON "ModerationRequest"("moderatorId");

-- AddForeignKey
ALTER TABLE "ModerationRequest" ADD CONSTRAINT "ModerationRequest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationRequest" ADD CONSTRAINT "ModerationRequest_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationRequest" ADD CONSTRAINT "ModerationRequest_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
