import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  IsUUID,
  Min,
  Max,
  IsObject,
  IsUrl,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Enums
export enum EventCategory {
  CAREER_FAIR = 'CAREER_FAIR',
  JOB_FAIR = 'JOB_FAIR',
  NETWORKING_EVENT = 'NETWORKING_EVENT',
  TECH_TALK = 'TECH_TALK',
  WORKSHOP = 'WORKSHOP',
  WEBINAR = 'WEBINAR',
  CONFERENCE = 'CONFERENCE',
  SEMINAR = 'SEMINAR',
  HACKATHON = 'HACKATHON',
  COMPETITION = 'COMPETITION',
  PANEL_DISCUSSION = 'PANEL_DISCUSSION',
  INTERVIEW_PREP = 'INTERVIEW_PREP',
  RESUME_REVIEW = 'RESUME_REVIEW',
  SKILL_BUILDING = 'SKILL_BUILDING',
  INDUSTRY_MIXER = 'INDUSTRY_MIXER',
  STARTUP_PITCH = 'STARTUP_PITCH',
  RESEARCH_SYMPOSIUM = 'RESEARCH_SYMPOSIUM',
  MENTORSHIP_EVENT = 'MENTORSHIP_EVENT',
  COMPANY_SHOWCASE = 'COMPANY_SHOWCASE',
  VIRTUAL_BOOTH = 'VIRTUAL_BOOTH',
  CAMPUS_VISIT = 'CAMPUS_VISIT',
  INFO_SESSION = 'INFO_SESSION',
  OPEN_HOUSE = 'OPEN_HOUSE',
  GRADUATION_EVENT = 'GRADUATION_EVENT',
  ALUMNI_MEETUP = 'ALUMNI_MEETUP',
}

export enum EventMode {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  HYBRID = 'HYBRID',
}

export enum EventStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
}

export enum EventPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum RegistrationStatus {
  REGISTERED = 'REGISTERED',
  WAITLISTED = 'WAITLISTED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum AttendanceStatus {
  REGISTERED = 'REGISTERED',
  CHECKED_IN = 'CHECKED_IN',
  ATTENDED = 'ATTENDED',
  NO_SHOW = 'NO_SHOW',
  LEFT_EARLY = 'LEFT_EARLY',
}

// Create Event DTO
export class CreateEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Short description for cards' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ description: 'Event type' })
  @IsString()
  type: string;

  @ApiProperty({ 
    description: 'Event category',
    enum: EventCategory,
    default: EventCategory.CAREER_FAIR 
  })
  @IsEnum(EventCategory)
  category: EventCategory;

  @ApiPropertyOptional({ 
    description: 'Event tags',
    type: [String] 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Event start date and time' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Event end date and time' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ 
    description: 'Timezone',
    default: 'UTC' 
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiProperty({ description: 'Event location' })
  @IsString()
  location: string;

  @ApiPropertyOptional({ description: 'Specific venue name' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ description: 'Full address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ 
    description: 'Event mode',
    enum: EventMode 
  })
  @IsEnum(EventMode)
  mode: EventMode;

  @ApiPropertyOptional({ description: 'Meeting link for virtual/hybrid events' })
  @IsOptional()
  @IsUrl()
  meetingLink?: string;

  @ApiPropertyOptional({ description: 'Streaming URL for live streaming' })
  @IsOptional()
  @IsUrl()
  streamingUrl?: string;

  @ApiProperty({ 
    description: 'Event capacity',
    minimum: 1 
  })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ description: 'Registration deadline' })
  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @ApiPropertyOptional({ 
    description: 'Registration fee',
    minimum: 0,
    default: 0 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  registrationFee?: number;

  @ApiPropertyOptional({ 
    description: 'Is registration open',
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  isRegistrationOpen?: boolean;

  @ApiPropertyOptional({ 
    description: 'Requires approval for registration',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ 
    description: 'Is event public',
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ 
    description: 'Is event featured',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ 
    description: 'Event priority',
    enum: EventPriority,
    default: EventPriority.MEDIUM 
  })
  @IsOptional()
  @IsEnum(EventPriority)
  priority?: EventPriority;

  @ApiPropertyOptional({ description: 'Event banner image URL' })
  @IsOptional()
  @IsUrl()
  bannerImage?: string;

  @ApiPropertyOptional({ 
    description: 'Gallery images',
    type: [String] 
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  gallery?: string[];

  @ApiPropertyOptional({ description: 'Event agenda (JSON format)' })
  @IsOptional()
  @IsObject()
  agenda?: any;

  @ApiPropertyOptional({ description: 'Speaker information (JSON format)' })
  @IsOptional()
  @IsObject()
  speakers?: any;

  @ApiPropertyOptional({ description: 'Sponsor information (JSON format)' })
  @IsOptional()
  @IsObject()
  sponsors?: any;

  @ApiPropertyOptional({ 
    description: 'Resource links',
    type: [String] 
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  resources?: string[];

  @ApiPropertyOptional({ 
    description: 'Enable networking features',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  enableNetworking?: boolean;

  @ApiPropertyOptional({ 
    description: 'Enable chat features',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  enableChat?: boolean;

  @ApiPropertyOptional({ 
    description: 'Enable Q&A features',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  enableQA?: boolean;

  @ApiPropertyOptional({ description: 'Company ID (if company event)' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'University ID (if university event)' })
  @IsOptional()
  @IsUUID()
  universityId?: string;
}

// Update Event DTO (partial)
export class UpdateEventDto {
  @ApiPropertyOptional({ description: 'Event title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Short description for cards' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'Event type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ 
    description: 'Event category',
    enum: EventCategory 
  })
  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @ApiPropertyOptional({ 
    description: 'Event tags',
    type: [String] 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Event start date and time' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Event end date and time' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ description: 'Event location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Specific venue name' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ description: 'Full address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ 
    description: 'Event mode',
    enum: EventMode 
  })
  @IsOptional()
  @IsEnum(EventMode)
  mode?: EventMode;

  @ApiPropertyOptional({ description: 'Meeting link for virtual/hybrid events' })
  @IsOptional()
  @IsUrl()
  meetingLink?: string;

  @ApiPropertyOptional({ description: 'Streaming URL for live streaming' })
  @IsOptional()
  @IsUrl()
  streamingUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Event capacity',
    minimum: 1 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ description: 'Registration deadline' })
  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @ApiPropertyOptional({ 
    description: 'Registration fee',
    minimum: 0 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  registrationFee?: number;

  @ApiPropertyOptional({ description: 'Is registration open' })
  @IsOptional()
  @IsBoolean()
  isRegistrationOpen?: boolean;

  @ApiPropertyOptional({ description: 'Requires approval for registration' })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ 
    description: 'Event status',
    enum: EventStatus 
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ description: 'Is event public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Is event featured' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ 
    description: 'Event priority',
    enum: EventPriority 
  })
  @IsOptional()
  @IsEnum(EventPriority)
  priority?: EventPriority;

  @ApiPropertyOptional({ description: 'Event banner image URL' })
  @IsOptional()
  @IsUrl()
  bannerImage?: string;

  @ApiPropertyOptional({ 
    description: 'Gallery images',
    type: [String] 
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  gallery?: string[];

  @ApiPropertyOptional({ description: 'Event agenda (JSON format)' })
  @IsOptional()
  @IsObject()
  agenda?: any;

  @ApiPropertyOptional({ description: 'Speaker information (JSON format)' })
  @IsOptional()
  @IsObject()
  speakers?: any;

  @ApiPropertyOptional({ description: 'Sponsor information (JSON format)' })
  @IsOptional()
  @IsObject()
  sponsors?: any;

  @ApiPropertyOptional({ 
    description: 'Resource links',
    type: [String] 
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  resources?: string[];

  @ApiPropertyOptional({ description: 'Enable networking features' })
  @IsOptional()
  @IsBoolean()
  enableNetworking?: boolean;

  @ApiPropertyOptional({ description: 'Enable chat features' })
  @IsOptional()
  @IsBoolean()
  enableChat?: boolean;

  @ApiPropertyOptional({ description: 'Enable Q&A features' })
  @IsOptional()
  @IsBoolean()
  enableQA?: boolean;
}

// Event Registration DTO
export class RegisterForEventDto {
  @ApiPropertyOptional({ description: 'Dietary restrictions' })
  @IsOptional()
  @IsString()
  dietaryRestrictions?: string;

  @ApiPropertyOptional({ description: 'Accessibility needs' })
  @IsOptional()
  @IsString()
  accessibilityNeeds?: string;

  @ApiPropertyOptional({ description: 'Emergency contact' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ description: 'T-shirt size' })
  @IsOptional()
  @IsString()
  tshirtSize?: string;

  @ApiPropertyOptional({ 
    description: 'Interests',
    type: [String] 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ description: 'Goals for the event' })
  @IsOptional()
  @IsString()
  goals?: string;

  @ApiPropertyOptional({ 
    description: 'What are you looking for',
    type: [String] 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lookingFor?: string[];

  @ApiPropertyOptional({ 
    description: 'Industries of interest',
    type: [String] 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @ApiPropertyOptional({ 
    description: 'Skills you have or want to learn',
    type: [String] 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Experience level' })
  @IsOptional()
  @IsString()
  experience?: string;
}

// Event Feedback DTO
export class EventFeedbackDto {
  @ApiProperty({ 
    description: 'Overall event rating (1-5)',
    minimum: 1,
    maximum: 5 
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating: number;

  @ApiPropertyOptional({ 
    description: 'Content quality rating (1-5)',
    minimum: 1,
    maximum: 5 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  contentRating?: number;

  @ApiPropertyOptional({ 
    description: 'Event organization rating (1-5)',
    minimum: 1,
    maximum: 5 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  organizationRating?: number;

  @ApiPropertyOptional({ 
    description: 'Venue/platform rating (1-5)',
    minimum: 1,
    maximum: 5 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  venueRating?: number;

  @ApiPropertyOptional({ 
    description: 'Networking opportunities rating (1-5)',
    minimum: 1,
    maximum: 5 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  networkingRating?: number;

  @ApiPropertyOptional({ description: 'General feedback' })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({ description: 'Suggestions for improvement' })
  @IsOptional()
  @IsString()
  improvements?: string;

  @ApiPropertyOptional({ description: 'What you liked most' })
  @IsOptional()
  @IsString()
  highlights?: string;

  @ApiPropertyOptional({ description: 'Would you recommend this event' })
  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;

  @ApiPropertyOptional({ description: 'Would you attend again' })
  @IsOptional()
  @IsBoolean()
  wouldAttendAgain?: boolean;

  @ApiPropertyOptional({ 
    description: 'Submit feedback anonymously',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiPropertyOptional({ 
    description: 'Make feedback public',
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// Event Search/Filter DTO
export class EventSearchDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Event category',
    enum: EventCategory 
  })
  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @ApiPropertyOptional({ 
    description: 'Event mode',
    enum: EventMode 
  })
  @IsOptional()
  @IsEnum(EventMode)
  mode?: EventMode;

  @ApiPropertyOptional({ 
    description: 'Event status',
    enum: EventStatus 
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ description: 'City filter' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State filter' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Country filter' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Start date filter (from)' })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ description: 'Start date filter (to)' })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({ description: 'Company ID filter' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'University ID filter' })
  @IsOptional()
  @IsUUID()
  universityId?: string;

  @ApiPropertyOptional({ description: 'Featured events only' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Free events only' })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ 
    description: 'Tags filter',
    type: [String] 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ 
    description: 'Page number',
    minimum: 1,
    default: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ 
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 10 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ 
    description: 'Sort by field',
    enum: ['startDate', 'createdAt', 'title', 'popularity'],
    default: 'startDate' 
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc' 
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

// Event Analytics DTO
export class EventAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date for analytics' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for analytics' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Event categories to include',
    type: [String] 
  })
  @IsOptional()
  @IsArray()
  @IsEnum(EventCategory, { each: true })
  categories?: EventCategory[];

  @ApiPropertyOptional({ description: 'Company ID filter' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'University ID filter' })
  @IsOptional()
  @IsUUID()
  universityId?: string;
}
