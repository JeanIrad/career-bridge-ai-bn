import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum EducationStatus {
  CURRENT = 'CURRENT',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  TRANSFERRED = 'TRANSFERRED',
}

export class CreateStudentEducationDto {
  @ApiProperty({ description: 'University ID' })
  @IsUUID()
  universityId: string;

  @ApiPropertyOptional({
    description: 'Degree type (e.g., Bachelor, Master, PhD)',
  })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiPropertyOptional({ description: 'Major/Field of study' })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({ description: 'Minor field of study' })
  @IsOptional()
  @IsString()
  minor?: string;

  @ApiPropertyOptional({ description: 'Current GPA', minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(10)
  gpa?: number;

  @ApiPropertyOptional({
    description: 'Maximum GPA scale',
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(10)
  maxGpa?: number;

  @ApiPropertyOptional({ description: 'Expected graduation year' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  graduationYear?: number;

  @ApiPropertyOptional({ description: 'Start year' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  startYear?: number;

  @ApiPropertyOptional({
    description: 'Current status',
    enum: EducationStatus,
  })
  @IsOptional()
  @IsEnum(EducationStatus)
  status?: EducationStatus;

  @ApiPropertyOptional({
    description: 'Extracurricular activities',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activities?: string[];

  @ApiPropertyOptional({
    description: 'Academic honors and awards',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  honors?: string[];

  @ApiPropertyOptional({ description: 'Is currently enrolled' })
  @IsOptional()
  @IsBoolean()
  isCurrently?: boolean;
}

export class UpdateStudentEducationDto {
  @ApiPropertyOptional({
    description: 'Degree type (e.g., Bachelor, Master, PhD)',
  })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiPropertyOptional({ description: 'Major/Field of study' })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({ description: 'Minor field of study' })
  @IsOptional()
  @IsString()
  minor?: string;

  @ApiPropertyOptional({ description: 'Current GPA', minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(10)
  gpa?: number;

  @ApiPropertyOptional({
    description: 'Maximum GPA scale',
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(10)
  maxGpa?: number;

  @ApiPropertyOptional({ description: 'Expected graduation year' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  graduationYear?: number;

  @ApiPropertyOptional({ description: 'Start year' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  startYear?: number;

  @ApiPropertyOptional({
    description: 'Current status',
    enum: EducationStatus,
  })
  @IsOptional()
  @IsEnum(EducationStatus)
  status?: EducationStatus;

  @ApiPropertyOptional({
    description: 'Extracurricular activities',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activities?: string[];

  @ApiPropertyOptional({
    description: 'Academic honors and awards',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  honors?: string[];

  @ApiPropertyOptional({ description: 'Is currently enrolled' })
  @IsOptional()
  @IsBoolean()
  isCurrently?: boolean;
}
