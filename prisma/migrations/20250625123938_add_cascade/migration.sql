-- DropForeignKey
ALTER TABLE "campus_events" DROP CONSTRAINT "campus_events_companyId_fkey";

-- AddForeignKey
ALTER TABLE "campus_events" ADD CONSTRAINT "campus_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
