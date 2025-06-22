-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('PHONE_SCREENING', 'TECHNICAL', 'BEHAVIORAL', 'PANEL', 'FINAL', 'HR', 'CODING_CHALLENGE', 'CASE_STUDY', 'PRESENTATION');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW');

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "interviewType" "InterviewType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "feedback" TEXT,
    "rating" INTEGER,
    "interviewerIds" TEXT[],
    "meetingLink" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillInDemand" (
    "id" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "demandCount" INTEGER NOT NULL DEFAULT 0,
    "growthPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillInDemand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyReview" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "pros" TEXT,
    "cons" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CompanyReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Interview_applicationId_idx" ON "Interview"("applicationId");

-- CreateIndex
CREATE INDEX "Interview_scheduledAt_idx" ON "Interview"("scheduledAt");

-- CreateIndex
CREATE INDEX "Interview_status_idx" ON "Interview"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateSource_name_key" ON "CandidateSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SkillInDemand_skillName_key" ON "SkillInDemand"("skillName");

-- CreateIndex
CREATE INDEX "CompanyReview_companyId_idx" ON "CompanyReview"("companyId");

-- CreateIndex
CREATE INDEX "CompanyReview_reviewerId_idx" ON "CompanyReview"("reviewerId");

-- CreateIndex
CREATE INDEX "CompanyReview_rating_idx" ON "CompanyReview"("rating");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyReview" ADD CONSTRAINT "CompanyReview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyReview" ADD CONSTRAINT "CompanyReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
