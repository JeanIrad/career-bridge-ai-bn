import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsUrl,
  IsArray,
  IsInt,
  Min,
  Max,
  IsBoolean,
  MinLength,
  MaxLength,
  IsEnum,
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DocumentType } from '@prisma/client';

export class CreateCompanyDto {
  @ApiProperty({ example: 'TechCorp Solutions', description: 'Company name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example:
      'Leading software development company specializing in innovative solutions',
    description: 'Company description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'Technology', description: 'Industry sector' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  industry: string;

  @ApiProperty({ example: '100-500', description: 'Company size range' })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiPropertyOptional({
    example: 'https://techcorp.com',
    description: 'Company website',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @ApiPropertyOptional({ example: 'Private', description: 'Company type' })
  @IsOptional()
  @IsString()
  @IsEnum(['Private', 'Public', 'Non-profit', 'Government', 'Startup'], {
    message:
      'Company type must be one of: Private, Public, Non-profit, Government, Startup',
  })
  type?: string;

  @ApiPropertyOptional({
    example: 2010,
    description: 'Year company was founded',
  })
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(new Date().getFullYear())
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  foundedYear?: number;

  @ApiPropertyOptional({
    example: ['Software Development', 'AI/ML', 'Cloud Computing'],
    description: 'Company specializations',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  specializations?: string[];

  @ApiPropertyOptional({
    example: '+1-555-0123',
    description: 'Company phone number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    example: 'contact@techcorp.com',
    description: 'Company email',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Company email must be a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    example: 'https://linkedin.com/company/techcorp',
    description: 'LinkedIn URL',
  })
  @IsOptional()
  @IsUrl({}, { message: 'LinkedIn must be a valid URL' })
  linkedIn?: string;

  @ApiPropertyOptional({
    example: 'https://twitter.com/techcorp',
    description: 'Twitter URL',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Twitter must be a valid URL' })
  twitter?: string;

  @ApiPropertyOptional({
    example: 'https://facebook.com/techcorp',
    description: 'Facebook URL',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Facebook must be a valid URL' })
  facebook?: string;

  // Location fields
  @ApiPropertyOptional({
    example: '123 Business Street, Suite 100',
    description: 'Company address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiProperty({ example: 'San Francisco', description: 'City' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({ example: 'California', description: 'State/Province' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiProperty({ example: 'United States', description: 'Country' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiPropertyOptional({ example: '94105', description: 'ZIP/Postal code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional({ example: 'US', description: 'ISO country code' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(3)
  countryCode?: string;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class CompanyQueryDto {
  @ApiPropertyOptional({
    example: 'tech',
    description: 'Search term for company name, description, or industry',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by verification status',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  verified?: boolean;

  @ApiPropertyOptional({
    example: 'Technology',
    description: 'Filter by industry',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({
    example: 'San Francisco',
    description: 'Filter by city',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    example: 'United States',
    description: 'Filter by country',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class CompanyVerificationDto {
  @ApiProperty({
    example: true,
    description: 'Whether to approve or reject the company',
  })
  @IsBoolean()
  isApproved: boolean;

  @ApiPropertyOptional({
    example: 'All documents verified successfully',
    description: 'Admin notes for the verification decision',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CompanyDocumentUploadDto {
  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.BUSINESS_LICENSE,
    description: 'Type of document being uploaded',
  })
  @IsEnum(DocumentType, {
    message: 'Document type must be a valid DocumentType',
  })
  documentType: DocumentType;
}

export class CompanyStatsDto {
  @ApiPropertyOptional({
    example: '30d',
    description: 'Time period for stats (7d, 30d, 90d, 1y)',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['7d', '30d', '90d', '1y'], {
    message: 'Period must be one of: 7d, 30d, 90d, 1y',
  })
  period?: string = '30d';
}

export class BulkCompanyActionDto {
  @ApiProperty({
    example: ['company-id-1', 'company-id-2'],
    description: 'Array of company IDs',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  companyIds: string[];

  @ApiProperty({
    example: 'approve',
    description: 'Action to perform on selected companies',
  })
  @IsString()
  @IsEnum(['approve', 'reject', 'delete'], {
    message: 'Action must be one of: approve, reject, delete',
  })
  action: string;

  @ApiPropertyOptional({
    example: 'Bulk approval after document review',
    description: 'Notes for the bulk action',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
