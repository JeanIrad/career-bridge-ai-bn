import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContentType {
  POST = 'POST',
  COMMENT = 'COMMENT',
  MESSAGE = 'MESSAGE',
  PROFILE = 'PROFILE',
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  JOB_POSTING = 'JOB_POSTING',
  COMPANY_DESCRIPTION = 'COMPANY_DESCRIPTION',
  USER_BIO = 'USER_BIO',
  REVIEW = 'REVIEW',
}

export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  AUTO_APPROVED = 'AUTO_APPROVED',
  AUTO_REJECTED = 'AUTO_REJECTED',
}

export enum ModerationAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  FLAG = 'FLAG',
  ESCALATE = 'ESCALATE',
  REQUEST_EDIT = 'REQUEST_EDIT',
  TEMPORARY_HIDE = 'TEMPORARY_HIDE',
  PERMANENT_BAN = 'PERMANENT_BAN',
  WARNING = 'WARNING',
}

export enum ViolationType {
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  HATE_SPEECH = 'HATE_SPEECH',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  COPYRIGHT_VIOLATION = 'COPYRIGHT_VIOLATION',
  FAKE_INFORMATION = 'FAKE_INFORMATION',
  VIOLENCE = 'VIOLENCE',
  ADULT_CONTENT = 'ADULT_CONTENT',
  DISCRIMINATION = 'DISCRIMINATION',
  SCAM = 'SCAM',
  OFF_TOPIC = 'OFF_TOPIC',
  DUPLICATE_CONTENT = 'DUPLICATE_CONTENT',
}

export enum SeverityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AutoModerationRule {
  PROFANITY_FILTER = 'PROFANITY_FILTER',
  SPAM_DETECTION = 'SPAM_DETECTION',
  LINK_VALIDATION = 'LINK_VALIDATION',
  IMAGE_CONTENT_SCAN = 'IMAGE_CONTENT_SCAN',
  SENTIMENT_ANALYSIS = 'SENTIMENT_ANALYSIS',
  DUPLICATE_DETECTION = 'DUPLICATE_DETECTION',
  RATE_LIMITING = 'RATE_LIMITING',
}

// ============= BASIC DTOs =============

export class CreateModerationRequestDto {
  @ApiProperty({
    enum: ContentType,
    description: 'Type of content being moderated',
  })
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({ description: 'ID of the content being moderated' })
  @IsString()
  contentId: string;

  @ApiProperty({ description: 'The actual content text/data' })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'ID of the user who created the content',
  })
  @IsOptional()
  @IsString()
  authorId?: string;

  @ApiPropertyOptional({ description: 'ID of the user reporting the content' })
  @IsOptional()
  @IsString()
  reporterId?: string;

  @ApiPropertyOptional({ description: 'Reason for reporting/moderation' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    enum: SeverityLevel,
    description: 'Severity level of the content',
  })
  @IsOptional()
  @IsEnum(SeverityLevel)
  severity?: SeverityLevel;

  @ApiPropertyOptional({ description: 'Additional metadata about the content' })
  @IsOptional()
  metadata?: any;
}

export class ModerationDecisionDto {
  @ApiProperty({
    enum: ModerationAction,
    description: 'Action to take on the content',
  })
  @IsEnum(ModerationAction)
  action: ModerationAction;

  @ApiPropertyOptional({ description: 'Reason for the moderation decision' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    enum: ViolationType,
    isArray: true,
    description: 'Types of violations found',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ViolationType, { each: true })
  violationTypes?: ViolationType[];

  @ApiPropertyOptional({ description: 'Additional notes from the moderator' })
  @IsOptional()
  @IsString()
  moderatorNotes?: string;

  @ApiPropertyOptional({ description: 'Whether to notify the content author' })
  @IsOptional()
  @IsBoolean()
  notifyAuthor?: boolean;

  @ApiPropertyOptional({ description: 'Custom message to send to the author' })
  @IsOptional()
  @IsString()
  customMessage?: string;
}

export class BulkModerationDto {
  @ApiProperty({ description: 'Array of content IDs to moderate' })
  @IsArray()
  @IsString({ each: true })
  contentIds: string[];

  @ApiProperty({
    enum: ModerationAction,
    description: 'Action to apply to all selected content',
  })
  @IsEnum(ModerationAction)
  action: ModerationAction;

  @ApiPropertyOptional({ description: 'Reason for the bulk action' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Whether to notify all affected authors',
  })
  @IsOptional()
  @IsBoolean()
  notifyAuthors?: boolean;
}

// ============= QUERY DTOs =============

export class ModerationFiltersDto {
  @ApiPropertyOptional({
    enum: ContentType,
    description: 'Filter by content type',
  })
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @ApiPropertyOptional({
    enum: ModerationStatus,
    description: 'Filter by moderation status',
  })
  @IsOptional()
  @IsEnum(ModerationStatus)
  status?: ModerationStatus;

  @ApiPropertyOptional({
    enum: SeverityLevel,
    description: 'Filter by severity level',
  })
  @IsOptional()
  @IsEnum(SeverityLevel)
  severity?: SeverityLevel;

  @ApiPropertyOptional({
    enum: ViolationType,
    isArray: true,
    description: 'Filter by violation types',
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(ViolationType, { each: true })
  violationTypes?: ViolationType[];

  @ApiPropertyOptional({ description: 'Filter by author ID' })
  @IsOptional()
  @IsString()
  authorId?: string;

  @ApiPropertyOptional({ description: 'Filter by moderator ID' })
  @IsOptional()
  @IsString()
  moderatorId?: string;

  @ApiPropertyOptional({ description: 'Filter by date range - start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by date range - end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search term for content' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number (default: 1)' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page (default: 20)' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order (asc/desc)' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Show only flagged content' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  flaggedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Show only auto-moderated content' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  autoModeratedOnly?: boolean;
}

// ============= AUTO-MODERATION DTOs =============

export class AutoModerationRuleDto {
  @ApiProperty({
    enum: AutoModerationRule,
    description: 'Type of auto-moderation rule',
  })
  @IsEnum(AutoModerationRule)
  ruleType: AutoModerationRule;

  @ApiProperty({ description: 'Whether the rule is enabled' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Configuration for the rule' })
  @IsOptional()
  configuration?: any;

  @ApiPropertyOptional({ description: 'Threshold for triggering the rule' })
  @IsOptional()
  @IsNumber()
  threshold?: number;

  @ApiPropertyOptional({
    enum: ModerationAction,
    description: 'Action to take when rule is triggered',
  })
  @IsOptional()
  @IsEnum(ModerationAction)
  action?: ModerationAction;
}

export class UpdateAutoModerationRulesDto {
  @ApiProperty({
    type: [AutoModerationRuleDto],
    description: 'Array of auto-moderation rules',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AutoModerationRuleDto)
  rules: AutoModerationRuleDto[];
}

// ============= ANALYTICS DTOs =============

export class ModerationAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date for analytics' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for analytics' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Granularity for time-based analytics' })
  @IsOptional()
  @IsString()
  granularity?: 'hour' | 'day' | 'week' | 'month' = 'day';
}

// ============= RESPONSE DTOs =============

export class ModerationRequestResponseDto {
  id: string;
  contentType: ContentType;
  contentId: string;
  content: string;
  authorId?: string;
  reporterId?: string;
  status: ModerationStatus;
  severity: SeverityLevel;
  violationTypes: ViolationType[];
  moderatorId?: string;
  moderatorNotes?: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  metadata?: any;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  moderator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class ModerationStatsDto {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  flaggedRequests: number;
  autoModeratedRequests: number;
  averageResolutionTime: number; // in minutes
  topViolationTypes: Array<{
    type: ViolationType;
    count: number;
    percentage: number;
  }>;
  contentTypeBreakdown: Array<{
    type: ContentType;
    count: number;
    percentage: number;
  }>;
  moderatorPerformance: Array<{
    moderatorId: string;
    moderatorName: string;
    requestsHandled: number;
    averageResolutionTime: number;
  }>;
}

export class PaginatedModerationResponseDto {
  success: boolean;
  message: string;
  data: ModerationRequestResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: ModerationFiltersDto;
  stats?: {
    totalPending: number;
    totalFlagged: number;
    totalToday: number;
  };
}
