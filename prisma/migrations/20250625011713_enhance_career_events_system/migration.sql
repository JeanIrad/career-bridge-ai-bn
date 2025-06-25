/*
  Warnings:

  - You are about to drop the `Chat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChatGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventRegistration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EventRegistrationToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GroupMembers` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('CAREER_FAIR', 'JOB_FAIR', 'NETWORKING_EVENT', 'TECH_TALK', 'WORKSHOP', 'WEBINAR', 'CONFERENCE', 'SEMINAR', 'HACKATHON', 'COMPETITION', 'PANEL_DISCUSSION', 'INTERVIEW_PREP', 'RESUME_REVIEW', 'SKILL_BUILDING', 'INDUSTRY_MIXER', 'STARTUP_PITCH', 'RESEARCH_SYMPOSIUM', 'MENTORSHIP_EVENT', 'COMPANY_SHOWCASE', 'VIRTUAL_BOOTH', 'CAMPUS_VISIT', 'INFO_SESSION', 'OPEN_HOUSE', 'GRADUATION_EVENT', 'ALUMNI_MEETUP');

-- CreateEnum
CREATE TYPE "EventPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('REGISTERED', 'WAITLISTED', 'CONFIRMED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('REGISTERED', 'CHECKED_IN', 'ATTENDED', 'NO_SHOW', 'LEFT_EARLY');

-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('GENERAL', 'SCHEDULE_CHANGE', 'VENUE_CHANGE', 'CANCELLATION', 'REMINDER', 'WELCOME', 'THANK_YOU', 'NETWORKING', 'TECHNICAL');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SUGGESTED', 'ACCEPTED', 'DECLINED', 'CONNECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ChatMessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'LINK', 'POLL', 'ANNOUNCEMENT');

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_fkey";

-- DropForeignKey
ALTER TABLE "ChatGroup" DROP CONSTRAINT "ChatGroup_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "EventRegistration" DROP CONSTRAINT "EventRegistration_eventId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMessage" DROP CONSTRAINT "GroupMessage_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMessage" DROP CONSTRAINT "GroupMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_chatId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_replyToId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "_EventRegistrationToUser" DROP CONSTRAINT "_EventRegistrationToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventRegistrationToUser" DROP CONSTRAINT "_EventRegistrationToUser_B_fkey";

-- DropForeignKey
ALTER TABLE "_GroupMembers" DROP CONSTRAINT "_GroupMembers_A_fkey";

-- DropForeignKey
ALTER TABLE "_GroupMembers" DROP CONSTRAINT "_GroupMembers_B_fkey";

-- DropTable
DROP TABLE "Chat";

-- DropTable
DROP TABLE "ChatGroup";

-- DropTable
DROP TABLE "Event";

-- DropTable
DROP TABLE "EventRegistration";

-- DropTable
DROP TABLE "GroupMessage";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "_EventRegistrationToUser";

-- DropTable
DROP TABLE "_GroupMembers";

-- DropEnum
DROP TYPE "MessageStatus";

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "type" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL DEFAULT 'CAREER_FAIR',
    "tags" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "duration" INTEGER,
    "location" TEXT NOT NULL,
    "venue" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "mode" "EventMode" NOT NULL,
    "meetingLink" TEXT,
    "streamingUrl" TEXT,
    "capacity" INTEGER NOT NULL,
    "currentAttendees" INTEGER NOT NULL DEFAULT 0,
    "registrationDeadline" TIMESTAMP(3),
    "registrationFee" DOUBLE PRECISION DEFAULT 0,
    "isRegistrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "priority" "EventPriority" NOT NULL DEFAULT 'MEDIUM',
    "bannerImage" TEXT,
    "gallery" TEXT[],
    "agenda" JSONB,
    "speakers" JSONB,
    "sponsors" JSONB,
    "resources" TEXT[],
    "enableNetworking" BOOLEAN NOT NULL DEFAULT false,
    "enableChat" BOOLEAN NOT NULL DEFAULT false,
    "enableQA" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "creatorId" TEXT NOT NULL,
    "companyId" TEXT,
    "universityId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInAt" TIMESTAMP(3),
    "attendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'REGISTERED',
    "dietaryRestrictions" TEXT,
    "accessibilityNeeds" TEXT,
    "emergencyContact" TEXT,
    "tshirtSize" TEXT,
    "interests" TEXT[],
    "goals" TEXT,
    "lookingFor" TEXT[],
    "industries" TEXT[],
    "skills" TEXT[],
    "experience" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendees" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedOutAt" TIMESTAMP(3),
    "attendanceDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_feedback" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "contentRating" INTEGER,
    "organizationRating" INTEGER,
    "venueRating" INTEGER,
    "networkingRating" INTEGER,
    "feedback" TEXT,
    "improvements" TEXT,
    "highlights" TEXT,
    "wouldRecommend" BOOLEAN,
    "wouldAttendAgain" BOOLEAN,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_announcements" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL DEFAULT 'GENERAL',
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "targetAudience" TEXT[],
    "publishAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "networking_matches" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "commonInterests" TEXT[],
    "status" "MatchStatus" NOT NULL DEFAULT 'SUGGESTED',
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "networking_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_chat_messages" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "ChatMessageType" NOT NULL DEFAULT 'TEXT',
    "attachments" TEXT[],
    "isModerated" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "event_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_qa" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "askedById" TEXT NOT NULL,
    "answeredById" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "isAnswered" BOOLEAN NOT NULL DEFAULT false,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_qa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_category_startDate_idx" ON "events"("category", "startDate");

-- CreateIndex
CREATE INDEX "events_city_startDate_idx" ON "events"("city", "startDate");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_isFeatured_idx" ON "events"("isFeatured");

-- CreateIndex
CREATE INDEX "events_companyId_idx" ON "events"("companyId");

-- CreateIndex
CREATE INDEX "events_universityId_idx" ON "events"("universityId");

-- CreateIndex
CREATE INDEX "event_registrations_eventId_idx" ON "event_registrations"("eventId");

-- CreateIndex
CREATE INDEX "event_registrations_userId_idx" ON "event_registrations"("userId");

-- CreateIndex
CREATE INDEX "event_registrations_status_idx" ON "event_registrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_eventId_userId_key" ON "event_registrations"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_attendees_eventId_idx" ON "event_attendees"("eventId");

-- CreateIndex
CREATE INDEX "event_attendees_userId_idx" ON "event_attendees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_eventId_userId_key" ON "event_attendees"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_feedback_eventId_idx" ON "event_feedback"("eventId");

-- CreateIndex
CREATE INDEX "event_feedback_overallRating_idx" ON "event_feedback"("overallRating");

-- CreateIndex
CREATE UNIQUE INDEX "event_feedback_eventId_userId_key" ON "event_feedback"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_announcements_eventId_idx" ON "event_announcements"("eventId");

-- CreateIndex
CREATE INDEX "event_announcements_publishAt_idx" ON "event_announcements"("publishAt");

-- CreateIndex
CREATE INDEX "networking_matches_eventId_idx" ON "networking_matches"("eventId");

-- CreateIndex
CREATE INDEX "networking_matches_user1Id_idx" ON "networking_matches"("user1Id");

-- CreateIndex
CREATE INDEX "networking_matches_user2Id_idx" ON "networking_matches"("user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "networking_matches_eventId_user1Id_user2Id_key" ON "networking_matches"("eventId", "user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "event_chat_messages_eventId_createdAt_idx" ON "event_chat_messages"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "event_chat_messages_userId_idx" ON "event_chat_messages"("userId");

-- CreateIndex
CREATE INDEX "event_qa_eventId_idx" ON "event_qa"("eventId");

-- CreateIndex
CREATE INDEX "event_qa_askedById_idx" ON "event_qa"("askedById");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_feedback" ADD CONSTRAINT "event_feedback_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_feedback" ADD CONSTRAINT "event_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_announcements" ADD CONSTRAINT "event_announcements_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "networking_matches" ADD CONSTRAINT "networking_matches_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "networking_matches" ADD CONSTRAINT "networking_matches_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "networking_matches" ADD CONSTRAINT "networking_matches_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_chat_messages" ADD CONSTRAINT "event_chat_messages_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_chat_messages" ADD CONSTRAINT "event_chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_qa" ADD CONSTRAINT "event_qa_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_qa" ADD CONSTRAINT "event_qa_askedById_fkey" FOREIGN KEY ("askedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_qa" ADD CONSTRAINT "event_qa_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
