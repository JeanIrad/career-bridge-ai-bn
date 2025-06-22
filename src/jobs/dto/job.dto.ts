import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsDateString,
  IsObject,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '@prisma/client';

export class SalaryDto {
  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'annually' })
  @IsOptional()
  @IsString()
  period?: string;
}

export class CreateJobDto {
  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'We are looking for a senior software engineer...' })
  @IsString()
  description: string;

  @ApiProperty({
    example: [
      "Bachelor's degree in Computer Science",
      '5+ years experience',
      'React expertise',
    ],
    description: 'Array of job requirements',
  })
  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @ApiProperty({ example: 'Full-time' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'San Francisco, CA' })
  @IsString()
  location: string;

  @ApiProperty({
    example: { min: 80000, max: 120000, currency: 'USD', period: 'annually' },
    description: 'Salary information as JSON object',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => SalaryDto)
  salary: SalaryDto;

  @ApiProperty({ example: '2024-12-31T23:59:59.000Z' })
  @IsDateString()
  applicationDeadline: string;

  @ApiPropertyOptional({ enum: JobStatus, default: JobStatus.ACTIVE })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}

export class UpdateJobDto {
  @ApiPropertyOptional({ example: 'Senior Software Engineer' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'We are looking for a senior software engineer...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: [
      "Bachelor's degree in Computer Science",
      '5+ years experience',
      'React expertise',
    ],
    description: 'Array of job requirements',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ example: 'Full-time' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'San Francisco, CA' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: { min: 80000, max: 120000, currency: 'USD', period: 'annually' },
    description: 'Salary information as JSON object',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SalaryDto)
  salary?: SalaryDto;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}

export class JobQueryDto {
  @ApiPropertyOptional({ example: 'software engineer' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'San Francisco' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Full-time' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'TechCorp' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class JobStatsDto {
  @ApiPropertyOptional({ example: '30d', enum: ['7d', '30d', '90d'] })
  @IsOptional()
  @IsString()
  period?: string = '30d';
}

export class JobApplicationDto {
  @ApiProperty({ example: 'https://example.com/resume.pdf' })
  @IsString()
  resumeUrl: string;

  @ApiPropertyOptional({ example: 'I am very interested in this position...' })
  @IsOptional()
  @IsString()
  coverLetter?: string;
}

export class UpdateJobStatusDto {
  @ApiProperty({ enum: JobStatus })
  @IsEnum(JobStatus)
  status: JobStatus;
}

export class JobFiltersDto {
  @ApiPropertyOptional({ example: ['Full-time', 'Part-time'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[];

  @ApiPropertyOptional({ example: ['San Francisco', 'New York'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locations?: string[];

  @ApiPropertyOptional({ example: ['Technology', 'Finance'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @ApiPropertyOptional({ example: { min: 50000, max: 150000 } })
  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryDto)
  salaryRange?: { min?: number; max?: number };

  @ApiPropertyOptional({ example: ['React', 'Node.js'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  remoteOnly?: boolean;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  deadlineBefore?: string;
}
