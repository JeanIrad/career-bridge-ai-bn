-- AlterTable
ALTER TABLE "users" ADD COLUMN     "cvUrl" TEXT;

-- CreateTable
CREATE TABLE "student_educations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "degree" TEXT,
    "major" TEXT,
    "minor" TEXT,
    "gpa" DOUBLE PRECISION,
    "maxGpa" DOUBLE PRECISION,
    "graduationYear" INTEGER,
    "startYear" INTEGER,
    "status" TEXT,
    "activities" TEXT[],
    "honors" TEXT[],
    "isCurrently" BOOLEAN NOT NULL DEFAULT false,
    "transcript" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_educations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_educations_userId_idx" ON "student_educations"("userId");

-- CreateIndex
CREATE INDEX "student_educations_universityId_idx" ON "student_educations"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "student_educations_userId_universityId_key" ON "student_educations"("userId", "universityId");

-- AddForeignKey
ALTER TABLE "student_educations" ADD CONSTRAINT "student_educations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_educations" ADD CONSTRAINT "student_educations_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
