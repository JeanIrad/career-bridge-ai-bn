import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsUUID,
  Min,
  Max,
  ArrayNotEmpty,
  IsEmail,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  MentorStatus,
  MeetingMode,
  MentorshipRequestStatus,
  RequestPriority,
  SessionType,
  SessionStatus,
  SessionValue,
  GoalCategory,
  GoalPriority,
  GoalStatus,
} from '@prisma/client';

// Mentor Profile DTOs
export class CreateMentorProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  expertise: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  industries: string[];

  @IsNumber()
  @Min(0)
  @Max(50)
  yearsOfExperience: number;

  @IsOptional()
  @IsString()
  currentRole?: string;

  @IsOptional()
  @IsString()
  currentCompany?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxMentees?: number = 5;

  @IsOptional()
  @IsEnum(MeetingMode)
  preferredMeetingMode?: MeetingMode = MeetingMode.VIRTUAL;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  availableHours?: any; // JSON object

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @IsOptional()
  @IsBoolean()
  isPaidMentor?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;

  @IsOptional()
  @IsBoolean()
  allowsGroupSessions?: boolean = false;
}

export class UpdateMentorProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertise?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  currentRole?: string;

  @IsOptional()
  @IsString()
  currentCompany?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxMentees?: number;

  @IsOptional()
  @IsEnum(MeetingMode)
  preferredMeetingMode?: MeetingMode;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  availableHours?: any;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isPaidMentor?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  allowsGroupSessions?: boolean;

  @IsOptional()
  @IsEnum(MentorStatus)
  status?: MentorStatus;
}

// Mentorship Request DTOs
export class CreateMentorshipRequestDto {
  @IsUUID()
  mentorId: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  goals: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  duration?: number; // weeks

  @IsOptional()
  @IsString()
  meetingFrequency?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority = RequestPriority.MEDIUM;

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean = false;
}

export class RespondToMentorshipRequestDto {
  @IsEnum(MentorshipRequestStatus)
  status: MentorshipRequestStatus;

  @IsOptional()
  @IsString()
  mentorResponse?: string;

  @IsOptional()
  @IsString()
  mentorNotes?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// Session DTOs
export class CreateSessionDto {
  @IsOptional()
  @IsUUID()
  mentorshipId?: string;

  @IsUUID()
  menteeId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  agenda?: string[];

  @IsOptional()
  @IsEnum(SessionType)
  sessionType?: SessionType = SessionType.ONE_ON_ONE;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(240)
  duration?: number = 60;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsEnum(MeetingMode)
  meetingMode?: MeetingMode = MeetingMode.VIRTUAL;

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  agenda?: string[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(240)
  duration?: number;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsEnum(MeetingMode)
  meetingMode?: MeetingMode;

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsString()
  sessionNotes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actionItems?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resources?: string[];

  @IsOptional()
  @IsBoolean()
  mentorAttended?: boolean;

  @IsOptional()
  @IsBoolean()
  menteeAttended?: boolean;

  @IsOptional()
  @IsString()
  noShowReason?: string;

  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @IsOptional()
  @IsDateString()
  nextSessionDate?: string;
}

// Feedback DTOs
export class CreateSessionFeedbackDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  preparationRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  helpfulnessRating?: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  improvements?: string;

  @IsOptional()
  @IsString()
  highlights?: string;

  @IsOptional()
  @IsBoolean()
  goalsMet?: boolean;

  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;

  @IsOptional()
  @IsEnum(SessionValue)
  sessionValue?: SessionValue = SessionValue.HELPFUL;
}

export class CreateMentorshipReviewDto {
  @IsOptional()
  @IsUUID()
  mentorshipId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  knowledgeRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  supportRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  availabilityRating?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  review: string;

  @IsOptional()
  @IsString()
  pros?: string;

  @IsOptional()
  @IsString()
  cons?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean = false;

  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;
}

// Goal Tracking DTOs
export class CreateGoalDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(GoalCategory)
  category?: GoalCategory = GoalCategory.CAREER;

  @IsOptional()
  @IsEnum(GoalPriority)
  priority?: GoalPriority = GoalPriority.MEDIUM;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  milestones?: any; // JSON array
}

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(GoalCategory)
  category?: GoalCategory;

  @IsOptional()
  @IsEnum(GoalPriority)
  priority?: GoalPriority;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  milestones?: any;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Query DTOs
export class MentorSearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return Array.isArray(value) ? value : [];
  })
  expertise?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return Array.isArray(value) ? value : [];
  })
  industries?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minExperience?: number;

  @IsOptional()
  @IsNumber()
  @Max(50)
  @Type(() => Number)
  maxExperience?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  isVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  isPaidMentor?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  @Type(() => Number)
  minRating?: number;

  @IsOptional()
  @IsEnum(MeetingMode)
  preferredMeetingMode?: MeetingMode;

  @IsOptional()
  @IsString()
  sortBy?: string = 'averageRating';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class SessionFilterDto {
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(SessionType)
  sessionType?: SessionType;

  @IsOptional()
  @IsUUID()
  mentorshipId?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'scheduledAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}
