import { ApiProperty } from '@nestjs/swagger';
import { DocumentType, VerificationStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsArray,
  IsString,
  ArrayMinSize,
} from 'class-validator';

export class UploadDocumentQueryDto {
  @ApiProperty({
    enum: DocumentType,
    required: false,
    description: 'Filter documents by type',
  })
  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @ApiProperty({
    enum: VerificationStatus,
    required: false,
    description: 'Filter documents by verification status',
  })
  @IsEnum(VerificationStatus)
  @IsOptional()
  verificationStatus?: VerificationStatus;

  @ApiProperty({
    type: Boolean,
    required: false,
    description:
      'Filter by verification status (true = verified, false = not verified)',
  })
  @IsOptional()
  isVerified?: boolean;
}

export class BulkUploadDto {
  @ApiProperty({
    enum: DocumentType,
    description: 'Type of documents being uploaded',
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;
}

export class BulkDeleteDto {
  @ApiProperty({
    type: [String],
    description: 'Array of document IDs to delete',
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  documentIds: string[];
}

export class DocumentResponseDto {
  @ApiProperty({ description: 'Document ID' })
  id: string;

  @ApiProperty({ enum: DocumentType, description: 'Type of document' })
  documentType: DocumentType;

  @ApiProperty({ description: 'Original filename' })
  originalName: string;

  @ApiProperty({ description: 'Document URL' })
  url: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ description: 'File size in MB (formatted)' })
  fileSizeMB: string;

  @ApiProperty({ description: 'Upload timestamp' })
  uploadedAt: Date;

  @ApiProperty({ enum: VerificationStatus, description: 'Verification status' })
  verificationStatus: VerificationStatus;

  @ApiProperty({ description: 'Whether document is verified' })
  isVerified: boolean;

  @ApiProperty({ description: 'Verification notes', nullable: true })
  verificationNotes?: string;
}

export class DocumentStatisticsDto {
  @ApiProperty({ description: 'Total number of documents' })
  totalDocuments: number;

  @ApiProperty({ description: 'Number of verified documents' })
  verifiedDocuments: number;

  @ApiProperty({ description: 'Number of pending documents' })
  pendingDocuments: number;

  @ApiProperty({
    description: 'Count of documents by type',
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  documentsByType: { [key in DocumentType]?: number };

  @ApiProperty({ description: 'Total storage used in bytes' })
  storageUsed: number;

  @ApiProperty({ description: 'Total storage used in MB (formatted)' })
  storageUsedMB: string;
}
