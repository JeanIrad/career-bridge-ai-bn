import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsJSON,
  IsUrl,
  ValidateNested,
  IsPhoneNumber,
  IsNumber,
  IsObject,
  IsNotEmpty,
  MaxLength,
  Matches,
  IsIn,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UserRole, Gender, Visibility, AccountStatus } from '@prisma/client';

// Base User DTOs
export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message:
      'Please enter a valid phone number with country code (e.g., +250787308777)',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'STU2024001' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ example: 3.8, minimum: 0.0, maximum: 4.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(4.0)
  gpa?: number;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2030)
  graduationYear?: number;

  @ApiPropertyOptional({ example: 'Available for full-time' })
  @IsOptional()
  @IsString()
  availability?: string;

  @ApiPropertyOptional({ example: 'Harvard University' })
  @IsOptional()
  @IsString()
  university?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '10001' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'American' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ example: ['English', 'Spanish'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ example: ['Technology', 'Finance'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional({ example: 'Passionate software engineer...' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional({ example: 'https://example.com/resume.pdf' })
  @IsOptional()
  @IsUrl()
  resume?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  socialLinks?: any;

  @ApiPropertyOptional({ enum: Visibility })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  major?: string;
}

// Education DTOs
export class CreateEducationDto {
  @ApiProperty({ example: 'Harvard University' })
  @IsString()
  institution: string;

  @ApiProperty({ example: 'Bachelor of Science' })
  @IsString()
  degree: string;

  @ApiProperty({ example: 'Computer Science' })
  @IsString()
  field: string;

  @ApiProperty({ example: '2020-09-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2024-05-15' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: '3.8' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ example: ['Computer Club', 'Chess Club'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activities?: string[];
}

export class UpdateEducationDto extends PartialType(CreateEducationDto) {}

// Experience DTOs
export class CreateExperienceDto {
  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Developed web applications...' })
  @IsString()
  description: string;

  @ApiProperty({ example: '2023-01-15' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2023-12-15' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiProperty({ example: 'San Francisco, CA' })
  @IsString()
  location: string;

  @ApiPropertyOptional({ example: ['JavaScript', 'React', 'Node.js'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ example: 'company-uuid' })
  @IsUUID()
  companyId: string;
}

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}

// Skill DTOs
export class CreateSkillDto {
  @ApiProperty({ example: 'JavaScript' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  endorsements?: number;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}

// Search and Filter DTOs - Enhanced for CareerBridgeAI
export class UserSearchFiltersDto {
  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  roles?: UserRole[];

  @ApiPropertyOptional({ example: ['JavaScript', 'Python'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  skills?: string[];

  @ApiPropertyOptional({ example: ['New York', 'San Francisco'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  cities?: string[];

  @ApiPropertyOptional({ example: ['USA', 'Canada'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  countries?: string[];

  @ApiPropertyOptional({ example: ['Computer Science', 'Engineering'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  fields?: string[];

  @ApiPropertyOptional({ example: ['Harvard', 'MIT'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  institutions?: string[];

  @ApiPropertyOptional({ example: ['Harvard University', 'MIT'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  universities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isVerified?: boolean;

  @ApiPropertyOptional({ example: [2024, 2025] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map((v) => parseInt(v, 10));
    if (typeof value === 'string') return [parseInt(value, 10)];
    return value;
  })
  graduationYears?: number[];

  @ApiPropertyOptional({ example: 3.5, minimum: 0.0, maximum: 4.0 })
  @IsOptional()
  @IsInt()
  @Min(0.0)
  @Max(4.0)
  minGpa?: number;

  @ApiPropertyOptional({ example: 4.0, minimum: 0.0, maximum: 4.0 })
  @IsOptional()
  @IsInt()
  @Min(0.0)
  @Max(4.0)
  maxGpa?: number;

  @ApiPropertyOptional({
    example: ['Available for full-time', 'Available for internship'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  availability?: string[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  minExperience?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  maxExperience?: number;

  @ApiPropertyOptional({ enum: Visibility, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Visibility, { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  visibility?: Visibility[];

  @ApiPropertyOptional({ example: ['STU2024001', 'STU2024002'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  studentIds?: string[];
}

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class UserSearchDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  roles?: UserRole[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isVerified?: boolean;

  @ApiPropertyOptional({ example: ['JavaScript', 'Python'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  skills?: string[];

  @ApiPropertyOptional({ example: ['New York', 'San Francisco'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  cities?: string[];

  @ApiPropertyOptional({ example: ['USA', 'Canada'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  countries?: string[];

  @ApiPropertyOptional({ example: ['Computer Science', 'Engineering'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  fields?: string[];

  @ApiPropertyOptional({ example: ['Harvard', 'MIT'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  institutions?: string[];

  @ApiPropertyOptional({ example: ['Harvard University', 'MIT'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  universities?: string[];

  @ApiPropertyOptional({ example: [2024, 2025] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map((v) => parseInt(v, 10));
    if (typeof value === 'string') return [parseInt(value, 10)];
    return value;
  })
  graduationYears?: number[];

  @ApiPropertyOptional({ example: 3.5, minimum: 0.0, maximum: 4.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(4.0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  minGpa?: number;

  @ApiPropertyOptional({ example: 4.0, minimum: 0.0, maximum: 4.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(4.0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  maxGpa?: number;

  @ApiPropertyOptional({
    example: ['Available for full-time', 'Available for internship'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  availability?: string[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  minExperience?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  maxExperience?: number;

  @ApiPropertyOptional({ enum: Visibility, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Visibility, { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  visibility?: Visibility[];

  @ApiPropertyOptional({ example: ['STU2024001', 'STU2024002'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  studentIds?: string[];

  // Keep the old filters property for backward compatibility but make it optional
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => UserSearchFiltersDto)
  filters?: UserSearchFiltersDto;
}

// Role-specific Filter DTOs for CareerBridgeAI
export class EmployerFiltersDto {
  @ApiPropertyOptional({ example: ['JavaScript', 'Python'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({ example: [2024, 2025] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  graduationYears?: number[];

  @ApiPropertyOptional({ example: 3.5 })
  @IsOptional()
  @IsInt()
  @Min(0.0)
  @Max(4.0)
  minGpa?: number;

  @ApiPropertyOptional({ example: ['Available for full-time'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availability?: string[];

  @ApiPropertyOptional({ example: ['Harvard University'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  universities?: string[];

  @ApiPropertyOptional({ example: ['Computer Science'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({ example: ['New York', 'San Francisco'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locations?: string[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minExperience?: number;
}

export class StudentFiltersDto {
  @ApiPropertyOptional({ example: ['JavaScript', 'Python'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: 3.5 })
  @IsOptional()
  @IsInt()
  @Min(0.0)
  @Max(4.0)
  minGpa?: number;

  @ApiPropertyOptional({ example: ['New York', 'Remote'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locations?: string[];

  @ApiPropertyOptional({ example: ['Technology', 'Finance'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @ApiPropertyOptional({ example: ['full-time', 'internship'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jobTypes?: string[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minExperience?: number;
}

// Comprehensive Recommendation DTOs for CareerBridgeAI
export class OpportunityRecommendationDto {
  @ApiProperty({
    example: 'jobs',
    enum: ['jobs', 'internships', 'mentorship', 'events', 'forums'],
  })
  @IsEnum(['jobs', 'internships', 'mentorship', 'events', 'forums'])
  type: 'jobs' | 'internships' | 'mentorship' | 'events' | 'forums';

  @ApiPropertyOptional({ example: ['JavaScript', 'Python'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({ example: ['New York', 'Remote'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredLocations?: string[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minExperience?: number;

  @ApiPropertyOptional({ example: ['Technology', 'Finance'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @ApiPropertyOptional({ example: 'entry-level' })
  @IsOptional()
  @IsString()
  experienceLevel?: string;
}

// Permission Management DTOs
export class RolePermissionsDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    example: ['browse_opportunities', 'apply_jobs', 'chat', 'comment'],
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

// Student ID Verification DTO
export class StudentVerificationDto {
  @ApiProperty({ example: 'STU2024001' })
  @IsString()
  studentId: string;

  @ApiProperty({ example: 'Harvard University' })
  @IsString()
  university: string;

  @ApiPropertyOptional({ example: 'verification-document.pdf' })
  @IsOptional()
  @IsString()
  documentUrl?: string;
}

// Verification DTOs
export class VerifyUserDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsBoolean()
  isVerified: boolean;

  @ApiPropertyOptional({ example: 'Document verified successfully' })
  @IsOptional()
  @IsString()
  verificationNote?: string;
}

// Account Status DTOs
export class UpdateAccountStatusDto {
  @ApiProperty({ enum: AccountStatus })
  @IsEnum(AccountStatus)
  status: AccountStatus;

  @ApiPropertyOptional({ example: 'Account suspended for policy violation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// Response DTOs
export class UserProfileResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  accountStatus: AccountStatus;
  headline?: string;
  bio?: string;
  avatar?: string;
  city?: string;
  country?: string;
  visibility: Visibility;
  education: any[];
  experiences: any[];
  skills: any[];
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedUsersResponseDto {
  data: UserProfileResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Legacy - keeping for backwards compatibility
export class RecommendationFiltersDto {
  @ApiProperty({ enum: UserRole, isArray: true })
  @IsArray()
  @IsEnum(UserRole, { each: true })
  targetRoles: UserRole[];

  @ApiPropertyOptional({ example: ['JavaScript', 'Python'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({ example: ['New York', 'Remote'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredLocations?: string[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minExperience?: number;

  @ApiPropertyOptional({ example: ['Technology', 'Finance'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];
}

export class GetRecommendationsDto extends PaginationDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => RecommendationFiltersDto)
  filters: RecommendationFiltersDto;
}

export class GetOpportunityRecommendationsDto extends PaginationDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => OpportunityRecommendationDto)
  filters: OpportunityRecommendationDto;
}

// ============= USER DELETION DTOs =============

export class SoftDeleteUserDto {
  @ApiProperty({
    description: 'Reason for deleting the user',
    example: 'Violation of terms of service',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class HardDeleteUserDto {
  @ApiProperty({
    description:
      'Confirmation code for hard delete (format: HARD_DELETE_{userId}_{YYYY-MM-DD})',
    example: 'HARD_DELETE_123e4567-e89b-12d3-a456-426614174000_2024-01-15',
  })
  @IsNotEmpty()
  @IsString()
  confirmationCode: string;
}

export class SelfDeleteAccountDto {
  @ApiProperty({
    description: 'Current password for verification',
    example: 'currentPassword123',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Reason for deleting the account',
    example: 'No longer need the service',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CleanupOldUsersDto {
  @ApiProperty({
    description: 'Number of days old for cleanup (default: 30)',
    example: 30,
    default: 30,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  daysOld?: number = 30;
}

export class DeletedUserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'User deleted successfully' })
  message: string;

  @ApiProperty({
    description: 'Deleted user data',
    required: false,
  })
  data?: any;
}

export class HardDeleteResponseDto {
  @ApiProperty({ example: 'User permanently deleted successfully' })
  message: string;

  @ApiProperty({
    description: 'Summary of deleted data',
    example: {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      role: 'STUDENT',
      educationRecords: 2,
      experienceRecords: 1,
      skillRecords: 5,
      postsCount: 10,
      commentsCount: 25,
      applicationsCount: 3,
      messagesCount: 50,
      documentsCount: 4,
      deletedAt: '2024-01-15T10:30:00Z',
    },
  })
  deletedData: {
    userId: string;
    email: string;
    role: string;
    educationRecords: number;
    experienceRecords: number;
    skillRecords: number;
    postsCount: number;
    commentsCount: number;
    applicationsCount: number;
    messagesCount: number;
    documentsCount: number;
    deletedAt: Date;
  };
}

export class CleanupResponseDto {
  @ApiProperty({ example: 'Cleanup completed. 5 users permanently deleted.' })
  message: string;

  @ApiProperty({ example: 5 })
  deletedCount: number;
}

// ============= ADMIN CREATE USER DTOs =============

export class CreateUserByAdminDto {
  // Basic Information
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message:
      'Please enter a valid phone number with country code (e.g., +250787308777)',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  // Organization Information
  @ApiPropertyOptional({ example: 'Tech Corp Inc.' })
  @IsOptional()
  @IsString()
  organizationName?: string;

  @ApiPropertyOptional({ example: 'https://techcorp.com' })
  @IsOptional()
  @IsUrl({}, { message: 'Organization website must be a valid URL' })
  organizationWebsite?: string;

  @ApiPropertyOptional({ example: 'Leading technology company...' })
  @IsOptional()
  @IsString()
  organizationDescription?: string;

  @ApiPropertyOptional({ example: '100-500' })
  @IsOptional()
  @IsString()
  organizationSize?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  industry?: string;

  // Location
  @ApiPropertyOptional({ example: 'United States' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'California' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'San Francisco' })
  @IsOptional()
  @IsString()
  city?: string;

  // Role & Permissions
  @ApiPropertyOptional({ example: 'HR Manager' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Human Resources' })
  @IsOptional()
  @IsString()
  department?: string;

  // University Specific
  @ApiPropertyOptional({ example: 'Public' })
  @IsOptional()
  @IsString()
  universityType?: string;

  @ApiPropertyOptional({ example: 'AACSB Accredited' })
  @IsOptional()
  @IsString()
  accreditation?: string;

  @ApiPropertyOptional({ example: 'Harvard University' })
  @IsOptional()
  @IsString()
  university?: string;

  // Employer Specific (Enhanced Company Fields)
  @ApiPropertyOptional({ example: 'Private' })
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiPropertyOptional({ example: 2010 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  foundedYear?: number;

  @ApiPropertyOptional({ example: ['Software Development', 'AI/ML'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @ApiPropertyOptional({ example: '100-500' })
  @IsOptional()
  @IsString()
  companySize?: string;

  @ApiPropertyOptional({ example: 'Leading technology company...' })
  @IsOptional()
  @IsString()
  companyDescription?: string;

  @ApiPropertyOptional({ example: 'https://company.com' })
  @IsOptional()
  @IsUrl({}, { message: 'Company website must be a valid URL' })
  companyWebsite?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  companyIndustry?: string;

  @ApiPropertyOptional({ example: '123 Business St' })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiPropertyOptional({ example: 'San Francisco' })
  @IsOptional()
  @IsString()
  companyCity?: string;

  @ApiPropertyOptional({ example: 'California' })
  @IsOptional()
  @IsString()
  companyState?: string;

  @ApiPropertyOptional({ example: 'United States' })
  @IsOptional()
  @IsString()
  companyCountry?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message:
      'Company phone must be a valid phone number with country code (e.g., +250787308777)',
  })
  companyPhone?: string;

  @ApiPropertyOptional({ example: 'contact@company.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Company email must be a valid email address' })
  companyEmail?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/company/example' })
  @IsOptional()
  @IsUrl({}, { message: 'Company LinkedIn must be a valid URL' })
  companyLinkedIn?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/company' })
  @IsOptional()
  @IsUrl({}, { message: 'Company Twitter must be a valid URL' })
  companyTwitter?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/company' })
  @IsOptional()
  @IsUrl({}, { message: 'Company Facebook must be a valid URL' })
  companyFacebook?: string;

  // Admin Specific
  @ApiPropertyOptional({ example: 'System Administrator' })
  @IsOptional()
  @IsString()
  adminLevel?: string;

  @ApiPropertyOptional({ example: ['manage_users', 'view_analytics'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  // Account Settings
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  sendWelcomeEmail?: boolean = true;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requirePasswordReset?: boolean = true;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean = false;

  @ApiPropertyOptional({ enum: AccountStatus })
  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus = AccountStatus.ACTIVE;

  // Student specific fields
  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2030)
  graduationYear?: number;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional({ example: 'Passionate software engineer...' })
  @IsOptional()
  @IsString()
  bio?: string;

  // Company creation flag for employers
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  createCompany?: boolean = false;

  // Company name alternatives
  @ApiPropertyOptional({ example: 'Tech Corp Inc.' })
  @IsOptional()
  @IsString()
  companyName?: string;

  // Location enhancement fields
  @ApiPropertyOptional({ example: '12345' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  // IP detection metadata
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  detectedFromIp?: boolean;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class CreateUserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'User created successfully' })
  message: string;

  @ApiProperty()
  data: {
    user: UserProfileResponseDto;
    temporaryPassword?: string;
    welcomeEmailSent?: boolean;
  };
}

// User Stats DTO for Admin Dashboard
export class RoleDistributionDto {
  @ApiProperty({ example: 150 })
  students: number;

  @ApiProperty({ example: 75 })
  alumni: number;

  @ApiProperty({ example: 50 })
  employers: number;

  @ApiProperty({ example: 25 })
  professors: number;
}

export class GenderDistributionDto {
  @ApiProperty({ example: 180 })
  male: number;

  @ApiProperty({ example: 120 })
  female: number;

  @ApiProperty({ example: 5 })
  other: number;

  @ApiProperty({ example: 15 })
  notSpecified: number;
}

export class UserStatsDto {
  @ApiProperty({ example: 300 })
  totalUsers: number;

  @ApiProperty({ example: 180 })
  verifiedUsers: number;

  @ApiProperty({ example: 250 })
  activeUsers: number;

  @ApiProperty({
    example: 60.0,
    description: 'Verification rate as a percentage',
  })
  verificationRate: number;

  @ApiProperty({ type: RoleDistributionDto })
  roleDistribution: RoleDistributionDto;

  @ApiProperty({ type: GenderDistributionDto })
  genderDistribution: GenderDistributionDto;
}

export class UserGrowthDto {
  @ApiProperty({ example: '2024-01' })
  month: string;

  @ApiProperty({ example: 150 })
  newUsers: number;

  @ApiProperty({ example: 1250 })
  totalUsers: number;

  @ApiProperty({ example: 12.5 })
  growthRate: number;
}

export class ActivityMetricsDto {
  @ApiProperty({ example: 850 })
  dailyActiveUsers: number;

  @ApiProperty({ example: 2400 })
  weeklyActiveUsers: number;

  @ApiProperty({ example: 8500 })
  monthlyActiveUsers: number;

  @ApiProperty({ example: 75.5 })
  engagementRate: number;

  @ApiProperty({ example: 25.5 })
  averageSessionDuration: number;
}

export class PlatformUsageDto {
  @ApiProperty({ example: 'Job Search' })
  feature: string;

  @ApiProperty({ example: 15847 })
  usageCount: number;

  @ApiProperty({ example: 68.5 })
  adoptionRate: number;

  @ApiProperty({ example: 12.5 })
  growthRate: number;
}

export class GeographicDataDto {
  @ApiProperty({ example: 'United States' })
  country: string;

  @ApiProperty({ example: 1250 })
  userCount: number;

  @ApiProperty({ example: 42.5 })
  percentage: number;

  @ApiProperty({ example: 'US' })
  countryCode: string;
}

export class AnalyticsOverviewDto {
  @ApiProperty({ example: 25847 })
  totalUsers: number;

  @ApiProperty({ example: 18650 })
  activeUsers: number;

  @ApiProperty({ example: 156789 })
  totalSessions: number;

  @ApiProperty({ example: 2456789 })
  pageViews: number;

  @ApiProperty({ example: 8.5 })
  averageSessionDuration: number;

  @ApiProperty({ example: 3.2 })
  bounceRate: number;

  @ApiProperty({ example: 12.5 })
  userGrowthRate: number;

  @ApiProperty({ example: 85.6 })
  retentionRate: number;
}

export class ComprehensiveAnalyticsDto {
  @ApiProperty({ type: AnalyticsOverviewDto })
  overview: AnalyticsOverviewDto;

  @ApiProperty({ type: [UserGrowthDto] })
  userGrowth: UserGrowthDto[];

  @ApiProperty({ type: ActivityMetricsDto })
  activityMetrics: ActivityMetricsDto;

  @ApiProperty({ type: [PlatformUsageDto] })
  platformUsage: PlatformUsageDto[];

  @ApiProperty({ type: [GeographicDataDto] })
  geographicData: GeographicDataDto[];

  @ApiProperty({ type: GenderDistributionDto })
  genderDistribution: GenderDistributionDto;

  @ApiProperty({ type: RoleDistributionDto })
  roleDistribution: RoleDistributionDto;
}

export class AnalyticsFiltersDto {
  @ApiProperty({
    example: '2024-01-01',
    required: false,
    description: 'Start date for analytics data (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: '2024-12-31',
    required: false,
    description: 'End date for analytics data (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    example: ['STUDENT', 'ALUMNI'],
    required: false,
    description: 'Filter by user roles',
    isArray: true,
    enum: ['STUDENT', 'ALUMNI', 'EMPLOYER', 'PROFESSOR'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['STUDENT', 'ALUMNI', 'EMPLOYER', 'PROFESSOR'], { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  roles?: string[];

  @ApiProperty({
    example: ['MALE', 'FEMALE'],
    required: false,
    description: 'Filter by gender',
    isArray: true,
    enum: ['MALE', 'FEMALE', 'OTHER'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'], { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  genders?: string[];

  @ApiProperty({
    example: ['US', 'CA', 'GB'],
    required: false,
    description: 'Filter by country codes',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  countries?: string[];

  @ApiProperty({
    example: true,
    required: false,
    description: 'Filter by verification status',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isVerified?: boolean;

  @ApiProperty({
    example: ['ACTIVE', 'INACTIVE'],
    required: false,
    description: 'Filter by account status',
    isArray: true,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'], { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  accountStatus?: string[];

  @ApiProperty({
    example: '30d',
    required: false,
    description: 'Time range preset',
    enum: ['7d', '30d', '90d', '6m', '1y', 'all'],
  })
  @IsOptional()
  @IsEnum(['7d', '30d', '90d', '6m', '1y', 'all'])
  timeRange?: string;
}

export class ExportReportDto {
  @ApiProperty({
    example: 'comprehensive',
    description: 'Type of report to export',
    enum: ['comprehensive', 'users', 'growth', 'engagement', 'geographic'],
  })
  @IsString()
  @IsEnum(['comprehensive', 'users', 'growth', 'engagement', 'geographic'])
  reportType: string;

  @ApiProperty({
    example: 'csv',
    description: 'Export format',
    enum: ['csv', 'json', 'xlsx', 'pdf'],
  })
  @IsString()
  @IsEnum(['csv', 'json', 'xlsx', 'pdf'])
  format: string;

  @ApiProperty({
    type: AnalyticsFiltersDto,
    required: false,
    description: 'Filters to apply to the export',
  })
  @IsOptional()
  @Type(() => AnalyticsFiltersDto)
  filters?: AnalyticsFiltersDto;

  @ApiProperty({
    example: ['overview', 'userGrowth', 'demographics'],
    required: false,
    description: 'Specific sections to include in the export',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sections?: string[];

  @ApiProperty({
    example: true,
    required: false,
    description: 'Include charts and visualizations in export',
  })
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;
}

// ============= PASSWORD MANAGEMENT =============

export class ChangePasswordDto {
  @ApiProperty({
    example: 'currentPassword123',
    description: 'Current password for verification',
  })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'newSecurePassword456',
    description: 'New password (minimum 8 characters)',
    minLength: 8,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;

  @ApiProperty({
    example: 'newSecurePassword456',
    description: 'Confirm new password (must match newPassword)',
  })
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}
