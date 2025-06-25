/*
  Warnings:

  - The `status` column on the `student_educations` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EducationStatus" AS ENUM ('CURRENT', 'COMPLETED', 'PAUSED', 'TRANSFERRED');

-- AlterTable
ALTER TABLE "student_educations" DROP COLUMN "status",
ADD COLUMN     "status" "EducationStatus" DEFAULT 'CURRENT';
