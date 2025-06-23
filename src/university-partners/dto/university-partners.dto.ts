import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsDate,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventMode, EventStatus } from '@prisma/client';

export enum PartnershipStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
}

export enum UniversityEventType {
  CAREER_FAIR = 'CAREER_FAIR',
  INFO_SESSION = 'INFO_SESSION',
  WORKSHOP = 'WORKSHOP',
  NETWORKING = 'NETWORKING',
  INTERVIEW_DAY = 'INTERVIEW_DAY',
  HACKATHON = 'HACKATHON',
  OTHER = 'OTHER',
}

export enum VisitStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
}

export class CreateUniversityPartnershipDto {
  @IsString()
  universityName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsArray()
  benefits?: string[];

  @IsOptional()
  @IsArray()
  requirements?: string[];

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsInt()
  hiringGoals?: number;

  @IsOptional()
  @IsInt()
  internshipGoals?: number;

  @IsOptional()
  @IsArray()
  preferredMajors?: string[];
}

export class UpdateUniversityPartnershipDto extends CreateUniversityPartnershipDto {
  @IsOptional()
  @IsEnum(PartnershipStatus)
  status?: PartnershipStatus;

  @IsOptional()
  @IsInt()
  studentsHired?: number;

  @IsOptional()
  @IsInt()
  internsHired?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateUniversityEventDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(UniversityEventType)
  eventType: UniversityEventType;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsOptional()
  @IsString()
  location?: string;

  @IsEnum(EventMode)
  mode: EventMode;

  @IsOptional()
  @IsInt()
  capacity?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  registrationDeadline?: Date;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

export class CreateUniversityVisitDto {
  @IsString()
  purpose: string;

  @Type(() => Date)
  @IsDate()
  visitDate: Date;

  @IsInt()
  duration: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

  @IsOptional()
  @IsArray()
  attendees?: string[];

  @IsOptional()
  @IsString()
  agenda?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UniversityPartnershipDto {
  @IsString()
  id: string;

  @IsString()
  universityId: string;

  @IsString()
  companyId: string;

  @IsEnum(PartnershipStatus)
  @IsOptional()
  status?: PartnershipStatus;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requirements?: string[];

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsInt()
  @IsOptional()
  hiringGoals?: number;

  @IsInt()
  @IsOptional()
  internshipGoals?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredMajors?: string[];

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
