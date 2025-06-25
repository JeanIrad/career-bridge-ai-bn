-- CreateEnum
CREATE TYPE "MentorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'VERIFIED');

-- CreateEnum
CREATE TYPE "MentorshipRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MentorshipStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('ONE_ON_ONE', 'GROUP', 'WORKSHOP', 'CONSULTATION', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "MeetingMode" AS ENUM ('VIRTUAL', 'IN_PERSON', 'HYBRID', 'PHONE');

-- CreateEnum
CREATE TYPE "SessionValue" AS ENUM ('VERY_HELPFUL', 'HELPFUL', 'NEUTRAL', 'NOT_HELPFUL', 'WASTE_OF_TIME');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('CAREER', 'SKILL_DEVELOPMENT', 'NETWORKING', 'LEADERSHIP', 'PERSONAL_GROWTH', 'TECHNICAL', 'COMMUNICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "GoalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UpdateType" AS ENUM ('PROGRESS', 'MILESTONE', 'NOTE', 'COMPLETION', 'REVISION');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'DROPPED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateTable
CREATE TABLE "mentor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "expertise" TEXT[],
    "industries" TEXT[],
    "yearsOfExperience" INTEGER NOT NULL,
    "currentRole" TEXT,
    "currentCompany" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "maxMentees" INTEGER NOT NULL DEFAULT 5,
    "currentMentees" INTEGER NOT NULL DEFAULT 0,
    "preferredMeetingMode" "MeetingMode" NOT NULL DEFAULT 'VIRTUAL',
    "timeZone" TEXT,
    "availableHours" JSONB,
    "hourlyRate" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isPaidMentor" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "averageRating" DOUBLE PRECISION DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION DEFAULT 0,
    "responseTime" INTEGER,
    "status" "MentorStatus" NOT NULL DEFAULT 'ACTIVE',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "allowsGroupSessions" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_requests" (
    "id" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goals" TEXT[],
    "duration" INTEGER,
    "meetingFrequency" TEXT,
    "status" "MentorshipRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "mentorResponse" TEXT,
    "mentorNotes" TEXT,
    "matchScore" DOUBLE PRECISION,
    "priority" "RequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorship_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorships" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goals" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "meetingFrequency" TEXT NOT NULL,
    "preferredDuration" INTEGER NOT NULL DEFAULT 60,
    "meetingMode" "MeetingMode" NOT NULL DEFAULT 'VIRTUAL',
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "progressScore" DOUBLE PRECISION DEFAULT 0,
    "status" "MentorshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "pausedAt" TIMESTAMP(3),
    "pauseReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "completionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_sessions" (
    "id" TEXT NOT NULL,
    "mentorshipId" TEXT,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "agenda" TEXT[],
    "sessionType" "SessionType" NOT NULL DEFAULT 'ONE_ON_ONE',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "timeZone" TEXT,
    "meetingMode" "MeetingMode" NOT NULL DEFAULT 'VIRTUAL',
    "meetingLink" TEXT,
    "location" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "actualDuration" INTEGER,
    "sessionNotes" TEXT,
    "actionItems" TEXT[],
    "resources" TEXT[],
    "recordings" TEXT[],
    "mentorAttended" BOOLEAN NOT NULL DEFAULT false,
    "menteeAttended" BOOLEAN NOT NULL DEFAULT false,
    "noShowReason" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "nextSessionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorship_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_feedback" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "preparationRating" INTEGER,
    "communicationRating" INTEGER,
    "helpfulnessRating" INTEGER,
    "feedback" TEXT,
    "improvements" TEXT,
    "highlights" TEXT,
    "goalsMet" BOOLEAN,
    "wouldRecommend" BOOLEAN,
    "sessionValue" "SessionValue" NOT NULL DEFAULT 'HELPFUL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_reviews" (
    "id" TEXT NOT NULL,
    "mentorshipId" TEXT,
    "mentorId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "communicationRating" INTEGER,
    "knowledgeRating" INTEGER,
    "supportRating" INTEGER,
    "availabilityRating" INTEGER,
    "title" TEXT,
    "review" TEXT NOT NULL,
    "pros" TEXT,
    "cons" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "wouldRecommend" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorship_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_tracking" (
    "id" TEXT NOT NULL,
    "mentorshipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "GoalCategory" NOT NULL DEFAULT 'CAREER',
    "priority" "GoalPriority" NOT NULL DEFAULT 'MEDIUM',
    "targetDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "milestones" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_updates" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "progress" INTEGER NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updateType" "UpdateType" NOT NULL DEFAULT 'PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_programs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" TEXT[],
    "duration" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "sessionCount" INTEGER NOT NULL DEFAULT 8,
    "sessionDuration" INTEGER NOT NULL DEFAULT 60,
    "meetingFrequency" TEXT NOT NULL DEFAULT 'weekly',
    "eligibilityCriteria" TEXT[],
    "prerequisites" TEXT[],
    "targetAudience" TEXT[],
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "applicationDeadline" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "currentEnrollment" INTEGER NOT NULL DEFAULT 0,
    "maxEnrollment" INTEGER NOT NULL DEFAULT 20,
    "createdBy" TEXT NOT NULL,
    "tags" TEXT[],
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorship_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_enrollments" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "applicationText" TEXT,
    "motivation" TEXT,
    "goals" TEXT[],
    "progress" INTEGER NOT NULL DEFAULT 0,
    "sessionsAttended" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProgramMentors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProgramMentors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "mentor_profiles_userId_key" ON "mentor_profiles"("userId");

-- CreateIndex
CREATE INDEX "mentor_profiles_isAvailable_isVerified_idx" ON "mentor_profiles"("isAvailable", "isVerified");

-- CreateIndex
CREATE INDEX "mentor_profiles_expertise_idx" ON "mentor_profiles"("expertise");

-- CreateIndex
CREATE INDEX "mentor_profiles_industries_idx" ON "mentor_profiles"("industries");

-- CreateIndex
CREATE INDEX "mentor_profiles_averageRating_idx" ON "mentor_profiles"("averageRating");

-- CreateIndex
CREATE INDEX "mentorship_requests_status_idx" ON "mentorship_requests"("status");

-- CreateIndex
CREATE INDEX "mentorship_requests_mentorId_status_idx" ON "mentorship_requests"("mentorId", "status");

-- CreateIndex
CREATE INDEX "mentorship_requests_menteeId_idx" ON "mentorship_requests"("menteeId");

-- CreateIndex
CREATE INDEX "mentorship_requests_requestedAt_idx" ON "mentorship_requests"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "mentorships_requestId_key" ON "mentorships"("requestId");

-- CreateIndex
CREATE INDEX "mentorships_status_idx" ON "mentorships"("status");

-- CreateIndex
CREATE INDEX "mentorships_menteeId_idx" ON "mentorships"("menteeId");

-- CreateIndex
CREATE INDEX "mentorships_mentorId_idx" ON "mentorships"("mentorId");

-- CreateIndex
CREATE INDEX "mentorships_startDate_endDate_idx" ON "mentorships"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "mentorship_sessions_scheduledAt_idx" ON "mentorship_sessions"("scheduledAt");

-- CreateIndex
CREATE INDEX "mentorship_sessions_status_idx" ON "mentorship_sessions"("status");

-- CreateIndex
CREATE INDEX "mentorship_sessions_mentorId_idx" ON "mentorship_sessions"("mentorId");

-- CreateIndex
CREATE INDEX "mentorship_sessions_menteeId_idx" ON "mentorship_sessions"("menteeId");

-- CreateIndex
CREATE INDEX "mentorship_sessions_mentorshipId_idx" ON "mentorship_sessions"("mentorshipId");

-- CreateIndex
CREATE INDEX "session_feedback_sessionId_idx" ON "session_feedback"("sessionId");

-- CreateIndex
CREATE INDEX "session_feedback_overallRating_idx" ON "session_feedback"("overallRating");

-- CreateIndex
CREATE UNIQUE INDEX "session_feedback_sessionId_userId_key" ON "session_feedback"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "mentorship_reviews_mentorId_idx" ON "mentorship_reviews"("mentorId");

-- CreateIndex
CREATE INDEX "mentorship_reviews_overallRating_idx" ON "mentorship_reviews"("overallRating");

-- CreateIndex
CREATE INDEX "mentorship_reviews_isPublic_idx" ON "mentorship_reviews"("isPublic");

-- CreateIndex
CREATE INDEX "goal_tracking_mentorshipId_idx" ON "goal_tracking"("mentorshipId");

-- CreateIndex
CREATE INDEX "goal_tracking_status_idx" ON "goal_tracking"("status");

-- CreateIndex
CREATE INDEX "goal_tracking_targetDate_idx" ON "goal_tracking"("targetDate");

-- CreateIndex
CREATE INDEX "goal_updates_goalId_idx" ON "goal_updates"("goalId");

-- CreateIndex
CREATE INDEX "goal_updates_createdAt_idx" ON "goal_updates"("createdAt");

-- CreateIndex
CREATE INDEX "mentorship_programs_status_idx" ON "mentorship_programs"("status");

-- CreateIndex
CREATE INDEX "mentorship_programs_startDate_idx" ON "mentorship_programs"("startDate");

-- CreateIndex
CREATE INDEX "mentorship_programs_tags_idx" ON "mentorship_programs"("tags");

-- CreateIndex
CREATE INDEX "program_enrollments_status_idx" ON "program_enrollments"("status");

-- CreateIndex
CREATE INDEX "program_enrollments_programId_idx" ON "program_enrollments"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "program_enrollments_programId_userId_key" ON "program_enrollments"("programId", "userId");

-- CreateIndex
CREATE INDEX "_ProgramMentors_B_index" ON "_ProgramMentors"("B");

-- AddForeignKey
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "mentorship_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentorshipId_fkey" FOREIGN KEY ("mentorshipId") REFERENCES "mentorships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_feedback" ADD CONSTRAINT "session_feedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "mentorship_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_feedback" ADD CONSTRAINT "session_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_reviews" ADD CONSTRAINT "mentorship_reviews_mentorshipId_fkey" FOREIGN KEY ("mentorshipId") REFERENCES "mentorships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_reviews" ADD CONSTRAINT "mentorship_reviews_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_reviews" ADD CONSTRAINT "mentorship_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_tracking" ADD CONSTRAINT "goal_tracking_mentorshipId_fkey" FOREIGN KEY ("mentorshipId") REFERENCES "mentorships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_updates" ADD CONSTRAINT "goal_updates_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goal_tracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_programs" ADD CONSTRAINT "mentorship_programs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "mentorship_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramMentors" ADD CONSTRAINT "_ProgramMentors_A_fkey" FOREIGN KEY ("A") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramMentors" ADD CONSTRAINT "_ProgramMentors_B_fkey" FOREIGN KEY ("B") REFERENCES "mentorship_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
