-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CO_OP', 'CONTRACT', 'FREELANCE', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "InternshipDuration" AS ENUM ('SUMMER', 'SEMESTER', 'QUARTER', 'YEAR_ROUND', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CompensationType" AS ENUM ('PAID', 'UNPAID', 'STIPEND', 'ACADEMIC_CREDIT');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "academicCredit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "applicationOpenDate" TIMESTAMP(3),
ADD COLUMN     "cohortSize" INTEGER,
ADD COLUMN     "compensationType" "CompensationType" NOT NULL DEFAULT 'PAID',
ADD COLUMN     "creditHours" INTEGER,
ADD COLUMN     "customDuration" TEXT,
ADD COLUMN     "duration" "InternshipDuration",
ADD COLUMN     "eligibleMajors" TEXT[],
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "fullTimeConversion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gpaRequirement" DOUBLE PRECISION,
ADD COLUMN     "graduationYear" INTEGER,
ADD COLUMN     "housingProvided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "housingStipend" DOUBLE PRECISION,
ADD COLUMN     "isInternship" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jobType" "JobType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "mealAllowance" DOUBLE PRECISION,
ADD COLUMN     "mentorshipProvided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "networkingEvents" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "portfolioRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferredSkills" TEXT[],
ADD COLUMN     "programName" TEXT,
ADD COLUMN     "returnOfferRate" DOUBLE PRECISION,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "stipendAmount" DOUBLE PRECISION,
ADD COLUMN     "trainingProvided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transcriptRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transportationStipend" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Job_jobType_idx" ON "Job"("jobType");

-- CreateIndex
CREATE INDEX "Job_isInternship_idx" ON "Job"("isInternship");

-- CreateIndex
CREATE INDEX "Job_applicationDeadline_idx" ON "Job"("applicationDeadline");

-- CreateIndex
CREATE INDEX "Job_startDate_idx" ON "Job"("startDate");
