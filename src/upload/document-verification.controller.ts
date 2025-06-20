import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadService } from './upload.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentType, VerificationStatus, UserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';

class VerifyDocumentDto {
  @IsEnum(VerificationStatus)
  verificationStatus: VerificationStatus;

  @IsOptional()
  @IsString()
  verificationNotes?: string;
}

class GetPendingDocumentsQueryDto {
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

@ApiTags('Document Verification')
@Controller('documents/verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentVerificationController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiOperation({
    summary: 'Get pending documents for verification (Admin only)',
    description: 'Retrieve all documents that are pending verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending documents retrieved successfully',
  })
  @ApiQuery({
    name: 'documentType',
    required: false,
    enum: DocumentType,
    description: 'Filter by document type',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @Get('pending')
  @Roles(UserRole.ADMIN)
  async getPendingDocuments(@Query() query: GetPendingDocumentsQueryDto) {
    const { documentType, page = 1, limit = 20 } = query;

    const documents = await this.uploadService.getPendingDocuments();

    // Filter by document type if specified
    let filteredDocuments = documents;
    if (documentType) {
      filteredDocuments = documents.filter(
        (doc) => doc.documentType === documentType,
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

    return {
      message: 'Pending documents retrieved successfully',
      documents: paginatedDocuments.map((doc) => ({
        id: doc.id,
        userId: doc.userId,
        documentType: doc.documentType,
        originalName: doc.originalName,
        url: doc.cloudinaryUrl,
        fileSize: doc.fileSize,
        fileSizeMB: (doc.fileSize / (1024 * 1024)).toFixed(2),
        uploadedAt: doc.uploadedAt,
        verificationStatus: doc.verificationStatus,
      })),
      pagination: {
        currentPage: page,
        totalItems: filteredDocuments.length,
        totalPages: Math.ceil(filteredDocuments.length / limit),
        itemsPerPage: limit,
      },
    };
  }

  @ApiOperation({
    summary: 'Verify or reject a document (Admin only)',
    description:
      'Update the verification status of a document with optional notes',
  })
  @ApiResponse({
    status: 200,
    description: 'Document verification status updated successfully',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID of the document to verify',
  })
  @ApiBody({
    type: VerifyDocumentDto,
    description: 'Verification details',
    schema: {
      type: 'object',
      properties: {
        verificationStatus: {
          type: 'string',
          enum: Object.values(VerificationStatus),
          description: 'New verification status',
        },
        verificationNotes: {
          type: 'string',
          description: 'Optional notes about the verification decision',
        },
      },
      required: ['verificationStatus'],
    },
  })
  @Patch(':documentId/verify')
  @Roles(UserRole.ADMIN)
  async verifyDocument(
    @Param('documentId') documentId: string,
    @Body() verifyDto: VerifyDocumentDto,
    @Request() req,
  ) {
    const verifierId = req.user.id;

    const document = await this.uploadService.verifyDocument(
      documentId,
      verifyDto.verificationStatus,
      verifyDto.verificationNotes,
    );

    // Log the verification action
    console.log(
      `Document ${documentId} ${verifyDto.verificationStatus} by ${verifierId}`,
    );

    return {
      message: `Document ${verifyDto.verificationStatus.toLowerCase()} successfully`,
      document: {
        id: document.id,
        documentType: document.documentType,
        verificationStatus: document.verificationStatus,
        isVerified: document.isVerified,
        verificationNotes: document.verificationNotes,
        verifiedAt: document.verifiedAt,
        verifiedBy: document.verifiedBy,
      },
    };
  }

  @ApiOperation({
    summary: 'Get verification statistics (Admin only)',
    description: 'Get overall statistics about document verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification statistics retrieved successfully',
  })
  @Get('statistics')
  @Roles(UserRole.ADMIN)
  async getVerificationStatistics() {
    const pendingDocuments = await this.uploadService.getPendingDocuments();

    // You might want to add more comprehensive stats methods to the service
    const stats = {
      totalPendingDocuments: pendingDocuments.length,
      pendingByType: {} as { [key in DocumentType]?: number },
      oldestPendingDocument: null as any,
      averageProcessingTime: null, // Could be calculated if you track verification dates
    };

    // Count pending documents by type
    for (const doc of pendingDocuments) {
      stats.pendingByType[doc.documentType] =
        (stats.pendingByType[doc.documentType] || 0) + 1;
    }

    // Find oldest pending document
    if (pendingDocuments.length > 0) {
      stats.oldestPendingDocument = pendingDocuments.reduce((oldest, doc) =>
        doc.uploadedAt < oldest.uploadedAt ? doc : oldest,
      );
    }

    return {
      message: 'Verification statistics retrieved successfully',
      statistics: stats,
    };
  }

  @ApiOperation({
    summary: 'Get user document verification history (Admin only)',
    description: 'Get all document verification history for a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'User document history retrieved successfully',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user whose documents to retrieve',
  })
  @Get('user/:userId/history')
  @Roles(UserRole.ADMIN)
  async getUserDocumentHistory(@Param('userId') userId: string) {
    const documents = await this.uploadService.getUserDocuments(userId);

    return {
      message: 'User document history retrieved successfully',
      userId,
      documents: documents.map((doc) => ({
        id: doc.id,
        documentType: doc.documentType,
        originalName: doc.originalName,
        uploadedAt: doc.uploadedAt,
        verificationStatus: doc.verificationStatus,
        isVerified: doc.isVerified,
        verificationNotes: doc.verificationNotes,
        verifiedAt: doc.verifiedAt,
        verifiedBy: doc.verifiedBy,
      })),
      summary: {
        totalDocuments: documents.length,
        verifiedDocuments: documents.filter((d) => d.isVerified).length,
        pendingDocuments: documents.filter(
          (d) => d.verificationStatus === VerificationStatus.PENDING,
        ).length,
        rejectedDocuments: documents.filter(
          (d) => d.verificationStatus === VerificationStatus.REJECTED,
        ).length,
      },
    };
  }
}
