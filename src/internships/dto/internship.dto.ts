import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsEnum,
  Min,
  Max,
  IsObject,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { JobType, InternshipDuration, CompensationType } from '@prisma/client';

// Base DTOs
export class SalaryDto {
  @IsNumber()
  min: number;

  @IsNumber()
  max: number;

  @IsString()
  currency: string;

  @IsString()
  period: string; // 'hourly', 'monthly', 'total'
}

// Search and Filter DTOs
export class InternshipSearchDto {
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
  locations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return Array.isArray(value) ? value : [];
  })
  companies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return Array.isArray(value) ? value : [];
  })
  types?: string[];

  @IsOptional()
  @IsEnum(InternshipDuration)
  duration?: InternshipDuration;

  @IsOptional()
  @IsEnum(CompensationType)
  compensationType?: CompensationType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minStipend?: number;

  @IsOptional()
  @IsNumber()
  @Max(50000)
  @Type(() => Number)
  maxStipend?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  housingProvided?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  mentorshipProvided?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  fullTimeConversion?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(2.0)
  @Max(4.0)
  @Type(() => Number)
  minGpa?: number;

  @IsOptional()
  @IsNumber()
  @Min(2024)
  @Max(2030)
  @Type(() => Number)
  graduationYear?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return Array.isArray(value) ? value : [];
  })
  majors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return Array.isArray(value) ? value : [];
  })
  skills?: string[];

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

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Create Internship DTO
export class CreateInternshipDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @IsString()
  type: string;

  @IsEnum(JobType)
  jobType: JobType = JobType.INTERNSHIP;

  @IsString()
  location: string;

  @ValidateNested()
  @Type(() => SalaryDto)
  salary: SalaryDto;

  @IsDateString()
  applicationDeadline: string;

  @IsBoolean()
  isInternship: boolean = true;

  @IsOptional()
  @IsEnum(InternshipDuration)
  duration?: InternshipDuration;

  @IsOptional()
  @IsString()
  customDuration?: string;

  @IsEnum(CompensationType)
  compensationType: CompensationType = CompensationType.PAID;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stipendAmount?: number;

  @IsOptional()
  @IsBoolean()
  housingProvided?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(0)
  housingStipend?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  transportationStipend?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mealAllowance?: number;

  @IsOptional()
  @IsBoolean()
  academicCredit?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  creditHours?: number;

  @IsOptional()
  @IsString()
  programName?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  cohortSize?: number;

  @IsOptional()
  @IsBoolean()
  mentorshipProvided?: boolean = false;

  @IsOptional()
  @IsBoolean()
  trainingProvided?: boolean = false;

  @IsOptional()
  @IsBoolean()
  networkingEvents?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(4.0)
  gpaRequirement?: number;

  @IsOptional()
  @IsNumber()
  @Min(2024)
  @Max(2030)
  graduationYear?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eligibleMajors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSkills?: string[];

  @IsOptional()
  @IsBoolean()
  portfolioRequired?: boolean = false;

  @IsOptional()
  @IsBoolean()
  transcriptRequired?: boolean = false;

  @IsOptional()
  @IsDateString()
  applicationOpenDate?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  fullTimeConversion?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  returnOfferRate?: number;

  @IsUUID()
  companyId: string;
}

// Update Internship DTO
export class UpdateInternshipDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryDto)
  salary?: SalaryDto;

  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;

  @IsOptional()
  @IsEnum(InternshipDuration)
  duration?: InternshipDuration;

  @IsOptional()
  @IsString()
  customDuration?: string;

  @IsOptional()
  @IsEnum(CompensationType)
  compensationType?: CompensationType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stipendAmount?: number;

  @IsOptional()
  @IsBoolean()
  housingProvided?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  housingStipend?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  transportationStipend?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mealAllowance?: number;

  @IsOptional()
  @IsBoolean()
  academicCredit?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  creditHours?: number;

  @IsOptional()
  @IsString()
  programName?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  cohortSize?: number;

  @IsOptional()
  @IsBoolean()
  mentorshipProvided?: boolean;

  @IsOptional()
  @IsBoolean()
  trainingProvided?: boolean;

  @IsOptional()
  @IsBoolean()
  networkingEvents?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(4.0)
  gpaRequirement?: number;

  @IsOptional()
  @IsNumber()
  @Min(2024)
  @Max(2030)
  graduationYear?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eligibleMajors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSkills?: string[];

  @IsOptional()
  @IsBoolean()
  portfolioRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  transcriptRequired?: boolean;

  @IsOptional()
  @IsDateString()
  applicationOpenDate?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  fullTimeConversion?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  returnOfferRate?: number;
}

// Application DTOs
export class CreateInternshipApplicationDto {
  @IsUUID()
  internshipId: string;

  @IsString()
  resumeUrl: string;

  @IsOptional()
  @IsString()
  coverLetter?: string;

  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  @IsOptional()
  @IsString()
  transcriptUrl?: string;

  @IsOptional()
  @IsString()
  additionalDocuments?: string;

  @IsOptional()
  @IsString()
  source?: string = 'direct';
}

export class UpdateApplicationStatusDto {
  @IsEnum([
    'PENDING',
    'REVIEWED',
    'SHORTLISTED',
    'INTERVIEWED',
    'ACCEPTED',
    'REJECTED',
  ])
  status: string;

  @IsOptional()
  @IsString()
  feedback?: string;
}

// Dashboard DTOs
export class InternshipDashboardDto {
  @IsOptional()
  @IsString()
  userId?: string;
}

// Response DTOs
export class InternshipStatsDto {
  totalInternships: number;
  appliedInternships: number;
  savedInternships: number;
  interviewInvites: number;
  acceptedApplications: number;
  pendingApplications: number;
}

export class InternshipResponseDto {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  type: string;
  jobType: string;
  location: string;
  salary: any;
  applicationDeadline: string;
  status: string;
  isInternship: boolean;
  duration?: string;
  customDuration?: string;
  compensationType: string;
  stipendAmount?: number;
  housingProvided?: boolean;
  housingStipend?: number;
  transportationStipend?: number;
  mealAllowance?: number;
  academicCredit?: boolean;
  creditHours?: number;
  programName?: string;
  cohortSize?: number;
  mentorshipProvided?: boolean;
  trainingProvided?: boolean;
  networkingEvents?: boolean;
  gpaRequirement?: number;
  graduationYear?: number;
  eligibleMajors?: string[];
  preferredSkills?: string[];
  portfolioRequired?: boolean;
  transcriptRequired?: boolean;
  applicationOpenDate?: string;
  startDate?: string;
  endDate?: string;
  fullTimeConversion?: boolean;
  returnOfferRate?: number;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    industry: string;
    size: string;
    isVerified: boolean;
  };
  postedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    applications: number;
    savedByUsers: number;
  };
  userApplication?: {
    id: string;
    status: string;
    appliedAt: string;
  };
  isSaved?: boolean;
}
