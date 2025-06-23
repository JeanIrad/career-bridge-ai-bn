/*
  Warnings:

  - The values [INACTIVE] on the enum `PartnershipStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `established` on the `universities` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `universities` table. All the data in the column will be lost.
  - You are about to drop the column `ranking` on the `universities` table. All the data in the column will be lost.
  - The `type` column on the `universities` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `contactEmail` on the `university_partnerships` table. All the data in the column will be lost.
  - You are about to drop the column `contactPerson` on the `university_partnerships` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `university_partnerships` table. All the data in the column will be lost.
  - You are about to drop the column `hiringGoals` on the `university_partnerships` table. All the data in the column will be lost.
  - You are about to drop the column `internshipGoals` on the `university_partnerships` table. All the data in the column will be lost.
  - You are about to drop the column `lastVisitDate` on the `university_partnerships` table. All the data in the column will be lost.
  - You are about to drop the column `preferredMajors` on the `university_partnerships` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `university_partnerships` table. All the data in the column will be lost.
  - The `benefits` column on the `university_partnerships` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `requirements` column on the `university_partnerships` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `university_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `university_visits` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[universityId,companyId]` on the table `university_partnerships` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `city` to the `universities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `university_partnerships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `university_partnerships` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UniversityType" AS ENUM ('PUBLIC', 'PRIVATE', 'COMMUNITY_COLLEGE', 'TECHNICAL_SCHOOL', 'RESEARCH_UNIVERSITY', 'LIBERAL_ARTS', 'HISTORICALLY_BLACK', 'WOMEN_COLLEGE', 'RELIGIOUS', 'MILITARY', 'ONLINE', 'FOR_PROFIT');

-- CreateEnum
CREATE TYPE "PartnershipPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PartnershipType" AS ENUM ('INTERNSHIP_PROGRAM', 'FULL_TIME_RECRUITMENT', 'CO_OP_PROGRAM', 'RESEARCH_COLLABORATION', 'GUEST_LECTURES', 'SCHOLARSHIP_PROGRAM', 'EQUIPMENT_DONATION', 'MENTORSHIP_PROGRAM', 'CAREER_SERVICES', 'PROJECT_BASED', 'CONSULTING', 'STARTUP_INCUBATION');

-- CreateEnum
CREATE TYPE "StudentYear" AS ENUM ('FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE', 'PHD', 'POST_DOC');

-- CreateEnum
CREATE TYPE "CampusEventType" AS ENUM ('CAREER_FAIR', 'INFO_SESSION', 'NETWORKING_EVENT', 'TECH_TALK', 'WORKSHOP', 'HACKATHON', 'INTERVIEW_DAY', 'COMPANY_PRESENTATION', 'PANEL_DISCUSSION', 'MOCK_INTERVIEWS', 'RESUME_REVIEW', 'INDUSTRY_MIXER', 'STARTUP_PITCH', 'RESEARCH_SYMPOSIUM');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "PartnershipStatus_new" AS ENUM ('DRAFT', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'TERMINATED', 'REJECTED');
ALTER TABLE "university_partnerships" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "university_partnerships" ALTER COLUMN "status" TYPE "PartnershipStatus_new" USING ("status"::text::"PartnershipStatus_new");
ALTER TYPE "PartnershipStatus" RENAME TO "PartnershipStatus_old";
ALTER TYPE "PartnershipStatus_new" RENAME TO "PartnershipStatus";
DROP TYPE "PartnershipStatus_old";
ALTER TABLE "university_partnerships" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "university_events" DROP CONSTRAINT "university_events_partnershipId_fkey";

-- DropForeignKey
ALTER TABLE "university_partnerships" DROP CONSTRAINT "university_partnerships_companyId_fkey";

-- DropForeignKey
ALTER TABLE "university_partnerships" DROP CONSTRAINT "university_partnerships_universityId_fkey";

-- DropForeignKey
ALTER TABLE "university_partnerships" DROP CONSTRAINT "university_partnerships_userId_fkey";

-- DropForeignKey
ALTER TABLE "university_visits" DROP CONSTRAINT "university_visits_partnershipId_fkey";

-- DropIndex
DROP INDEX "university_partnerships_companyId_idx";

-- DropIndex
DROP INDEX "university_partnerships_universityId_idx";

-- DropIndex
DROP INDEX "university_partnerships_userId_idx";

-- AlterTable
ALTER TABLE "universities" DROP COLUMN "established",
DROP COLUMN "location",
DROP COLUMN "ranking",
ADD COLUMN     "accreditation" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "banner" TEXT,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "colors" JSONB,
ADD COLUMN     "departments" TEXT[],
ADD COLUMN     "email" TEXT,
ADD COLUMN     "employmentRate" DOUBLE PRECISION,
ADD COLUMN     "establishedYear" INTEGER,
ADD COLUMN     "facultyCount" INTEGER,
ADD COLUMN     "graduationRate" DOUBLE PRECISION,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isPartnershipReady" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTopTier" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nationalRanking" INTEGER,
ADD COLUMN     "partnershipContact" TEXT,
ADD COLUMN     "partnershipEmail" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "popularMajors" TEXT[],
ADD COLUMN     "shortName" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "studentCount" INTEGER,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "worldRanking" INTEGER,
ADD COLUMN     "zipCode" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "UniversityType" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "university_partnerships" DROP COLUMN "contactEmail",
DROP COLUMN "contactPerson",
DROP COLUMN "contactPhone",
DROP COLUMN "hiringGoals",
DROP COLUMN "internshipGoals",
DROP COLUMN "lastVisitDate",
DROP COLUMN "preferredMajors",
DROP COLUMN "userId",
ADD COLUMN     "annualHiringGoal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "applicationsReceived" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "avgTimeToHire" INTEGER,
ADD COLUMN     "campusRecruitment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "careerFairs" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "companyContactEmail" TEXT,
ADD COLUMN     "companyContactName" TEXT,
ADD COLUMN     "companyContactPhone" TEXT,
ADD COLUMN     "complianceNotes" TEXT,
ADD COLUMN     "contractSigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contractUrl" TEXT,
ADD COLUMN     "coopGoal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "coopStudentsHired" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "entryLevelGoal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "equipmentDonation" TEXT,
ADD COLUMN     "exclusiveAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guestLectures" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "industryProjects" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "infoSessions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "internshipGoal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isRenewable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastActivityDate" TIMESTAMP(3),
ADD COLUMN     "minimumGPA" DOUBLE PRECISION,
ADD COLUMN     "networkingEvents" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "partnershipFee" DOUBLE PRECISION,
ADD COLUMN     "partnershipType" "PartnershipType"[],
ADD COLUMN     "priority" "PartnershipPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "recruitmentFee" DOUBLE PRECISION,
ADD COLUMN     "renewalDate" TIMESTAMP(3),
ADD COLUMN     "requiredCertifications" TEXT[],
ADD COLUMN     "researchCollaboration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "retentionRate" DOUBLE PRECISION,
ADD COLUMN     "satisfactionScore" DOUBLE PRECISION,
ADD COLUMN     "scholarshipAmount" DOUBLE PRECISION,
ADD COLUMN     "targetMajors" TEXT[],
ADD COLUMN     "targetSkills" TEXT[],
ADD COLUMN     "targetStudentYear" "StudentYear"[],
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "universityContactEmail" TEXT,
ADD COLUMN     "universityContactName" TEXT,
ADD COLUMN     "virtualRecruitment" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "benefits",
ADD COLUMN     "benefits" JSONB,
DROP COLUMN "requirements",
ADD COLUMN     "requirements" JSONB;

-- DropTable
DROP TABLE "university_events";

-- DropTable
DROP TABLE "university_visits";

-- DropEnum
DROP TYPE "UniversityEventType";

-- DropEnum
DROP TYPE "VisitStatus";

-- CreateTable
CREATE TABLE "campus_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "CampusEventType" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING',
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT,
    "location" TEXT,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "meetingLink" TEXT,
    "capacity" INTEGER,
    "registrationCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "requiresRSVP" BOOLEAN NOT NULL DEFAULT true,
    "rsvpDeadline" TIMESTAMP(3),
    "universityId" TEXT,
    "partnershipId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "budget" DOUBLE PRECISION,
    "targetHires" INTEGER NOT NULL DEFAULT 0,
    "actualHires" INTEGER NOT NULL DEFAULT 0,
    "targetMajors" TEXT[],
    "targetGradYear" INTEGER[],
    "targetSkills" TEXT[],
    "partnershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruitment_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campus_events_type_startDateTime_idx" ON "campus_events"("type", "startDateTime");

-- CreateIndex
CREATE INDEX "campus_events_universityId_idx" ON "campus_events"("universityId");

-- CreateIndex
CREATE INDEX "campus_events_companyId_idx" ON "campus_events"("companyId");

-- CreateIndex
CREATE INDEX "recruitment_campaigns_status_idx" ON "recruitment_campaigns"("status");

-- CreateIndex
CREATE INDEX "recruitment_campaigns_startDate_endDate_idx" ON "recruitment_campaigns"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "universities_country_city_idx" ON "universities"("country", "city");

-- CreateIndex
CREATE INDEX "universities_type_idx" ON "universities"("type");

-- CreateIndex
CREATE INDEX "universities_isPartnershipReady_idx" ON "universities"("isPartnershipReady");

-- CreateIndex
CREATE INDEX "university_partnerships_status_idx" ON "university_partnerships"("status");

-- CreateIndex
CREATE INDEX "university_partnerships_partnershipType_idx" ON "university_partnerships"("partnershipType");

-- CreateIndex
CREATE INDEX "university_partnerships_priority_idx" ON "university_partnerships"("priority");

-- CreateIndex
CREATE INDEX "university_partnerships_startDate_endDate_idx" ON "university_partnerships"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "university_partnerships_universityId_companyId_key" ON "university_partnerships"("universityId", "companyId");

-- AddForeignKey
ALTER TABLE "university_partnerships" ADD CONSTRAINT "university_partnerships_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_partnerships" ADD CONSTRAINT "university_partnerships_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_partnerships" ADD CONSTRAINT "university_partnerships_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_events" ADD CONSTRAINT "campus_events_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_events" ADD CONSTRAINT "campus_events_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "university_partnerships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_events" ADD CONSTRAINT "campus_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_campaigns" ADD CONSTRAINT "recruitment_campaigns_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "university_partnerships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
