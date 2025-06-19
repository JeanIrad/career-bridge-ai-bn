import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UploadDocumentQueryDto {
  @ApiProperty({
    enum: DocumentType,
    required: false,
    description: 'Filter documents by type',
  })
  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;
}
