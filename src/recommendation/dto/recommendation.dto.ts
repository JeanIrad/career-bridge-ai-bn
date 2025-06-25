import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnhancedFiltersDto {
  @ApiPropertyOptional({ example: 'San Francisco' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: ['Full-time', 'Part-time'],
    description: 'Array of job types',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  jobType?: string[];

  @ApiPropertyOptional({
    example: ['Entry Level', 'Mid Level'],
    description: 'Array of experience levels',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  experience?: string[];

  @ApiPropertyOptional({
    example: { min: 50000, max: 100000 },
    description: 'Salary range object',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryRangeDto)
  salary?: { min?: number; max?: number };

  @ApiPropertyOptional({
    example: ['JavaScript', 'React'],
    description: 'Array of skills',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  skills?: string[];

  @ApiPropertyOptional({
    example: ['Google', 'Microsoft'],
    description: 'Array of company names',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  company?: string[];

  @ApiPropertyOptional({
    example: ['Technology', 'Finance'],
    description: 'Array of industries',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  industry?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Filter for remote-only positions',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  })
  remoteOnly?: boolean;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiPropertyOptional({
    example: ['Startup', 'Large Corporation'],
    description: 'Array of company sizes',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  companySize?: string[];

  @ApiPropertyOptional({
    example: ['Health Insurance', 'Remote Work'],
    description: 'Array of benefits',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  benefits?: string[];

  @ApiPropertyOptional({
    example: ['Full-time', '9-5'],
    description: 'Array of work schedules',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  workSchedule?: string[];
}

export class SalaryRangeDto {
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
}

export class UserPreferencesDto {
  @ApiPropertyOptional({
    example: ['Software Development', 'Team Leadership'],
    description: 'Array of career goals',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  careerGoals?: string[];

  @ApiPropertyOptional({
    example: 'remote',
    enum: ['remote', 'onsite', 'hybrid', 'any'],
    description: 'Preferred work environment',
  })
  @IsOptional()
  @IsEnum(['remote', 'onsite', 'hybrid', 'any'])
  workEnvironment?: 'remote' | 'onsite' | 'hybrid' | 'any';

  @ApiPropertyOptional({
    example: ['Collaborative', 'Innovation-focused'],
    description: 'Array of company culture preferences',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  companyCulture?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Importance of learning opportunities',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  })
  learningOpportunities?: boolean;

  @ApiPropertyOptional({
    example: 8,
    minimum: 1,
    maximum: 10,
    description: 'Work-life balance importance (1-10 scale)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  workLifeBalance?: number;

  @ApiPropertyOptional({
    example: 6,
    minimum: 1,
    maximum: 10,
    description: 'Salary importance (1-10 scale)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  salaryImportance?: number;

  @ApiPropertyOptional({
    example: 9,
    minimum: 1,
    maximum: 10,
    description: 'Growth potential importance (1-10 scale)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  growthPotential?: number;

  @ApiPropertyOptional({
    example: ['Technology', 'Healthcare'],
    description: 'Array of preferred industries',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  industryPreferences?: string[];

  @ApiPropertyOptional({
    example: ['Individual Contributor', 'Management'],
    description: 'Array of preferred role types',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  roleTypes?: string[];

  @ApiPropertyOptional({
    example: ['CompanyX', 'CompanyY'],
    description: 'Array of companies to avoid',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  avoidCompanies?: string[];

  @ApiPropertyOptional({
    example: ['Health Insurance', 'Stock Options'],
    description: 'Array of preferred benefits',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  preferredBenefits?: string[];
}

export class RecommendationQueryDto {
  @ApiPropertyOptional({
    example: 20,
    minimum: 1,
    maximum: 100,
    description: 'Number of recommendations to return',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  limit?: number = 20;

  @ApiPropertyOptional({
    example: true,
    description: 'Include recommendation analytics',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value !== 'false';
    }
    return value;
  })
  includeAnalytics?: boolean = true;
}

export class MarketIntelligenceQueryDto {
  @ApiPropertyOptional({
    example: 'JavaScript,React,Node.js',
    description: 'Comma-separated list of skills to analyze',
  })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({
    example: 'San Francisco',
    description: 'Location for market analysis',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: 'Technology',
    description: 'Industry for market analysis',
  })
  @IsOptional()
  @IsString()
  industry?: string;
}

export class CombinedRecommendationQueryDto extends RecommendationQueryDto {
  // Filters from EnhancedFiltersDto
  @ApiPropertyOptional({ example: 'San Francisco' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: ['Full-time', 'Part-time'],
    description: 'Array of job types',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  jobType?: string[];

  @ApiPropertyOptional({
    example: ['Entry Level', 'Mid Level'],
    description: 'Array of experience levels',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  experience?: string[];

  @ApiPropertyOptional({
    example: { min: 50000, max: 100000 },
    description: 'Salary range object',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryRangeDto)
  salary?: { min?: number; max?: number };

  @ApiPropertyOptional({
    example: ['JavaScript', 'React'],
    description: 'Array of skills',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  skills?: string[];

  @ApiPropertyOptional({
    example: ['Google', 'Microsoft'],
    description: 'Array of company names',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  company?: string[];

  @ApiPropertyOptional({
    example: ['Technology', 'Finance'],
    description: 'Array of industries',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  industry?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Filter for remote-only positions',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  })
  remoteOnly?: boolean;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiPropertyOptional({
    example: ['Startup', 'Large Corporation'],
    description: 'Array of company sizes',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  companySize?: string[];

  @ApiPropertyOptional({
    example: ['Health Insurance', 'Remote Work'],
    description: 'Array of benefits',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  benefits?: string[];

  @ApiPropertyOptional({
    example: ['Full-time', '9-5'],
    description: 'Array of work schedules',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  workSchedule?: string[];

  // Preferences from UserPreferencesDto
  @ApiPropertyOptional({
    example: ['Software Development', 'Team Leadership'],
    description: 'Array of career goals',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  careerGoals?: string[];

  @ApiPropertyOptional({
    example: 'remote',
    enum: ['remote', 'onsite', 'hybrid', 'any'],
    description: 'Preferred work environment',
  })
  @IsOptional()
  @IsEnum(['remote', 'onsite', 'hybrid', 'any'])
  workEnvironment?: 'remote' | 'onsite' | 'hybrid' | 'any';

  @ApiPropertyOptional({
    example: ['Collaborative', 'Innovation-focused'],
    description: 'Array of company culture preferences',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  companyCulture?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Importance of learning opportunities',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  })
  learningOpportunities?: boolean;

  @ApiPropertyOptional({
    example: 8,
    minimum: 1,
    maximum: 10,
    description: 'Work-life balance importance (1-10 scale)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  workLifeBalance?: number;

  @ApiPropertyOptional({
    example: 6,
    minimum: 1,
    maximum: 10,
    description: 'Salary importance (1-10 scale)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  salaryImportance?: number;

  @ApiPropertyOptional({
    example: 9,
    minimum: 1,
    maximum: 10,
    description: 'Growth potential importance (1-10 scale)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  growthPotential?: number;

  @ApiPropertyOptional({
    example: ['Technology', 'Healthcare'],
    description: 'Array of preferred industries',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  industryPreferences?: string[];

  @ApiPropertyOptional({
    example: ['Individual Contributor', 'Management'],
    description: 'Array of preferred role types',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  roleTypes?: string[];

  @ApiPropertyOptional({
    example: ['CompanyX', 'CompanyY'],
    description: 'Array of companies to avoid',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  avoidCompanies?: string[];

  @ApiPropertyOptional({
    example: ['Health Insurance', 'Stock Options'],
    description: 'Array of preferred benefits',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim());
    }
    return value;
  })
  preferredBenefits?: string[];
}
