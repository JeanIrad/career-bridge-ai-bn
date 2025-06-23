import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsJSON,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PartnershipStatus,
  PartnershipPriority,
  PartnershipType,
  StudentYear,
} from '@prisma/client';

export class CreateUniversityPartnershipDto {
  @IsString()
  universityId: string;

  @IsString()
  companyId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PartnershipPriority)
  @IsOptional()
  priority?: PartnershipPriority;

  // Partnership scope and goals
  @IsArray()
  @IsEnum(PartnershipType, { each: true })
  @IsOptional()
  partnershipType?: PartnershipType[];

  @IsArray()
  @IsEnum(StudentYear, { each: true })
  @IsOptional()
  targetStudentYear?: StudentYear[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetMajors?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetSkills?: string[];

  // Hiring goals and metrics
  @IsInt()
  @Min(0)
  @IsOptional()
  annualHiringGoal?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  internshipGoal?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  coopGoal?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  entryLevelGoal?: number;

  // Benefits offered to university
  @IsJSON()
  @IsOptional()
  benefits?: any;

  @IsNumber()
  @Min(0)
  @IsOptional()
  scholarshipAmount?: number;

  @IsString()
  @IsOptional()
  equipmentDonation?: string;

  @IsBoolean()
  @IsOptional()
  guestLectures?: boolean;

  @IsBoolean()
  @IsOptional()
  industryProjects?: boolean;

  @IsBoolean()
  @IsOptional()
  researchCollaboration?: boolean;

  // Requirements from university
  @IsJSON()
  @IsOptional()
  requirements?: any;

  @IsBoolean()
  @IsOptional()
  exclusiveAccess?: boolean;

  @IsNumber()
  @Min(0)
  @Max(4.0)
  @IsOptional()
  minimumGPA?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredCertifications?: string[];

  // Contact information
  @IsString()
  @IsOptional()
  companyContactName?: string;

  @IsString()
  @IsOptional()
  companyContactEmail?: string;

  @IsString()
  @IsOptional()
  companyContactPhone?: string;

  // Partnership activities
  @IsBoolean()
  @IsOptional()
  campusRecruitment?: boolean;

  @IsBoolean()
  @IsOptional()
  virtualRecruitment?: boolean;

  @IsBoolean()
  @IsOptional()
  careerFairs?: boolean;

  @IsBoolean()
  @IsOptional()
  infoSessions?: boolean;

  @IsBoolean()
  @IsOptional()
  networkingEvents?: boolean;

  // Financial terms
  @IsNumber()
  @Min(0)
  @IsOptional()
  partnershipFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  recruitmentFee?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  // Timeline
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  // Notes
  @IsString()
  @IsOptional()
  notes?: string;
}
