/*
  Warnings:

  - The `status` column on the `university_partnerships` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "university_partnerships" DROP COLUMN "status",
ADD COLUMN     "status" "PartnershipStatus" NOT NULL DEFAULT 'PENDING';
