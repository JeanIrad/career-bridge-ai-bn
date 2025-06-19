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
  @IsPhoneNumber()
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
  roles?: UserRole[];

  @ApiPropertyOptional({ example: ['JavaScript', 'Python'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: ['New York', 'San Francisco'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cities?: string[];

  @ApiPropertyOptional({ example: ['USA', 'Canada'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countries?: string[];

  @ApiPropertyOptional({ example: ['Computer Science', 'Engineering'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({ example: ['Harvard', 'MIT'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  institutions?: string[];

  @ApiPropertyOptional({ example: ['Harvard University', 'MIT'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  universities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ example: [2024, 2025] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
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
  availability?: string[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minExperience?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxExperience?: number;

  @ApiPropertyOptional({ enum: Visibility, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Visibility, { each: true })
  visibility?: Visibility[];

  @ApiPropertyOptional({ example: ['STU2024001', 'STU2024002'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
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
