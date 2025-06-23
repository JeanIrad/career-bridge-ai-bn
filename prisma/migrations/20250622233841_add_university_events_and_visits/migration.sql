-- AlterTable
ALTER TABLE "university_partnerships" ADD COLUMN     "internsHired" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastVisitDate" TIMESTAMP(3),
ADD COLUMN     "studentsHired" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "university_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "UniversityEventType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "mode" "EventMode" NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "registrations" INTEGER NOT NULL DEFAULT 0,
    "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnershipId" TEXT NOT NULL,

    CONSTRAINT "university_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_visits" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partnershipId" TEXT NOT NULL,

    CONSTRAINT "university_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "university_events_partnershipId_idx" ON "university_events"("partnershipId");

-- CreateIndex
CREATE INDEX "university_visits_partnershipId_idx" ON "university_visits"("partnershipId");

-- AddForeignKey
ALTER TABLE "university_events" ADD CONSTRAINT "university_events_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "university_partnerships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_visits" ADD CONSTRAINT "university_visits_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "university_partnerships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
