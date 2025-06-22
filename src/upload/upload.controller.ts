import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UploadService } from './upload.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadDocumentQueryDto } from './dto/documents.dto';
import { DocumentType } from '@prisma/client';

const multerConfig = {
  storage: diskStorage({
    destination: './uploads/temp',
    filename: (req, file, callback) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for portfolios
  },
};

@ApiTags('Document Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ================= INDIVIDUAL DOCUMENT UPLOADS =================

  @ApiOperation({ summary: 'Upload degree certificate (PDF, JPG, PNG)' })
  @ApiResponse({
    status: 201,
    description: 'Degree certificate uploaded successfully',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Degree certificate file (PDF, JPG, PNG)',
        },
      },
    },
  })
  @Post('degree-certificate')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadDegreeCertificate(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    const document = await this.uploadService.uploadDegreeCertificate(
      userId,
      file,
    );

    return {
      message: 'Degree certificate uploaded successfully',
      document: this.formatDocumentResponse(document),
    };
  }

  @ApiOperation({ summary: 'Upload transcript (PDF, JPG, PNG)' })
  @ApiResponse({ status: 201, description: 'Transcript uploaded successfully' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Transcript file (PDF, JPG, PNG)',
        },
      },
    },
  })
  @Post('transcript')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadTranscript(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    const document = await this.uploadService.uploadTranscript(userId, file);

    return {
      message: 'Transcript uploaded successfully',
      document: this.formatDocumentResponse(document),
    };
  }

  @ApiOperation({ summary: 'Upload ID document (PDF, JPG, PNG)' })
  @ApiResponse({
    status: 201,
    description: 'ID document uploaded successfully',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'ID document file (PDF, JPG, PNG)',
        },
      },
    },
  })
  @Post('id-document')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadIdDocument(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    const document = await this.uploadService.uploadIdDocument(userId, file);

    return {
      message: 'ID document uploaded successfully',
      document: this.formatDocumentResponse(document),
    };
  }

  @ApiOperation({ summary: 'Upload business license (PDF, JPG, PNG)' })
  @ApiResponse({
    status: 201,
    description: 'Business license uploaded successfully',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Business license file (PDF, JPG, PNG)',
        },
      },
    },
  })
  @Post('business-license')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadBusinessLicense(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    const document = await this.uploadService.uploadBusinessLicense(
      userId,
      file,
    );

    return {
      message: 'Business license uploaded successfully',
      document: this.formatDocumentResponse(document),
    };
  }

  @ApiOperation({ summary: 'Upload company registration (PDF, JPG, PNG)' })
  @ApiResponse({
    status: 201,
    description: 'Company registration uploaded successfully',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Company registration file (PDF, JPG, PNG)',
        },
      },
    },
  })
  @Post('company-registration')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadCompanyRegistration(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    const document = await this.uploadService.uploadCompanyRegistration(
      userId,
      file,
    );

    return {
      message: 'Company registration uploaded successfully',
      document: this.formatDocumentResponse(document),
    };
  }

  @ApiOperation({ summary: 'Upload portfolio (PDF, ZIP, JPG, PNG, DOC, DOCX)' })
  @ApiResponse({ status: 201, description: 'Portfolio uploaded successfully' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Portfolio file (PDF, ZIP, JPG, PNG, DOC, DOCX) - Max 50MB',
        },
      },
    },
  })
  @Post('portfolio')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadPortfolio(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    const document = await this.uploadService.uploadPortfolio(userId, file);

    return {
      message: 'Portfolio uploaded successfully',
      document: this.formatDocumentResponse(document),
    };
  }

  @ApiOperation({ summary: 'Upload cover letter (PDF, DOC, DOCX, TXT)' })
  @ApiResponse({
    status: 201,
    description: 'Cover letter uploaded successfully',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Cover letter file (PDF, DOC, DOCX, TXT)',
        },
      },
    },
  })
  @Post('cover-letter')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadCoverLetter(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    const document = await this.uploadService.uploadCoverLetter(userId, file);

    return {
      message: 'Cover letter uploaded successfully',
      document: this.formatDocumentResponse(document),
    };
  }

  @ApiOperation({ summary: 'Upload recommendation letter (PDF, DOC, DOCX)' })
  @ApiResponse({
    status: 201,
    description: 'Recommendation letter uploaded successfully',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Recommendation letter file (PDF, DOC, DOCX)',
        },
      },
    },
  })
  @Post('recommendation-letter')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadRecommendationLetter(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    const document = await this.uploadService.uploadRecommendationLetter(
      userId,
      file,
    );

    return {
      message: 'Recommendation letter uploaded successfully',
      document: this.formatDocumentResponse(document),
    };
  }

  @ApiOperation({ summary: 'Upload company logo (JPG, PNG, WEBP)' })
  @ApiResponse({
    status: 201,
    description: 'Company logo uploaded successfully',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Company logo file (JPG, PNG, WEBP)',
        },
      },
    },
  })
  @Post('company-logo')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadCompanyLogo(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    const document = await this.uploadService.uploadCompanyLogo(userId, file);

    return {
      message: 'Company logo uploaded successfully',
      document: this.formatDocumentResponse(document),
    };
  }

  // ================= BULK OPERATIONS =================

  @ApiOperation({ summary: 'Upload multiple documents of the same type' })
  @ApiResponse({ status: 201, description: 'Documents uploaded successfully' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Multiple files to upload',
        },
        documentType: {
          type: 'string',
          enum: Object.values(DocumentType),
          description: 'Type of documents being uploaded',
        },
      },
    },
  })
  @Post('bulk')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  async uploadMultipleDocuments(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('documentType') documentType: DocumentType,
    @Request() req,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (!documentType) {
      throw new BadRequestException('Document type is required');
    }

    const userId = req.user.id;
    const documents = await this.uploadService.uploadMultipleDocuments(
      userId,
      files,
      documentType,
    );

    return {
      message: `${documents.length} documents uploaded successfully`,
      documents: documents.map((doc) => this.formatDocumentResponse(doc)),
    };
  }

  @ApiOperation({ summary: 'Delete multiple documents' })
  @ApiResponse({ status: 200, description: 'Documents deleted successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        documentIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of document IDs to delete',
        },
      },
    },
  })
  @Delete('bulk')
  async bulkDeleteDocuments(
    @Body('documentIds') documentIds: string[],
    @Request() req,
  ) {
    if (!documentIds || documentIds.length === 0) {
      throw new BadRequestException('No document IDs provided');
    }

    const userId = req.user.id;
    await this.uploadService.bulkDeleteDocuments(userId, documentIds);

    return {
      message: `${documentIds.length} documents deleted successfully`,
    };
  }

  // ================= EXISTING ENDPOINTS (Enhanced) =================

  @ApiOperation({ summary: 'Upload resume (PDF, DOC, DOCX)' })
  @ApiResponse({ status: 201, description: 'Resume uploaded successfully' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Resume file (PDF, DOC, DOCX)',
        },
      },
    },
  })
  @Post('resume')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    const document = await this.uploadService.uploadResume(userId, file);

    return {
      message: 'Resume uploaded successfully',
      document: this.formatDocumentResponse(document),
    };
  }

  @ApiOperation({ summary: 'Upload profile picture (JPG, PNG, WEBP)' })
  @ApiResponse({
    status: 201,
    description: 'Profile picture uploaded successfully',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture file (JPG, PNG, WEBP)',
        },
      },
    },
  })
  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    const document = await this.uploadService.uploadProfilePicture(
      userId,
      file,
    );

    return {
      message: 'Profile picture uploaded successfully',
      document: this.formatDocumentResponse(document),
    };
  }

  // ================= DOCUMENT MANAGEMENT =================

  @ApiOperation({ summary: 'Get user documents with optional filtering' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  @ApiQuery({
    name: 'documentType',
    required: false,
    enum: DocumentType,
    description: 'Filter by document type',
  })
  @Get('documents')
  async getUserDocuments(
    @Request() req,
    @Query() query: UploadDocumentQueryDto,
  ) {
    const userId = req.user.id;
    const documents = await this.uploadService.getUserDocuments(
      userId,
      query.documentType,
    );

    return {
      message: 'Documents retrieved successfully',
      documents: documents.map((doc) => this.formatDocumentResponse(doc)),
    };
  }

  @ApiOperation({ summary: 'Get document statistics' })
  @ApiResponse({
    status: 200,
    description: 'Document statistics retrieved successfully',
  })
  @Get('statistics')
  async getDocumentStatistics(@Request() req) {
    const userId = req.user.id;
    const statistics = await this.uploadService.getDocumentStatistics(userId);

    return {
      message: 'Document statistics retrieved successfully',
      statistics: {
        ...statistics,
        storageUsedMB: (statistics.storageUsed / (1024 * 1024)).toFixed(2),
      },
    };
  }

  @ApiOperation({ summary: 'Delete specific document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiParam({ name: 'documentId', description: 'Document ID to delete' })
  @Delete('documents/:documentId')
  async deleteDocument(
    @Param('documentId') documentId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    await this.uploadService.deleteDocument(userId, documentId);

    return {
      message: 'Document deleted successfully',
    };
  }

  @ApiOperation({ summary: 'Get upload guidelines and requirements' })
  @ApiResponse({ status: 200, description: 'Upload guidelines retrieved' })
  @Get('guidelines')
  async getUploadGuidelines() {
    return {
      message: 'Upload guidelines retrieved successfully',
      guidelines: {
        documentTypes: {
          DEGREE_CERTIFICATE: {
            allowedFormats: ['PDF', 'JPG', 'PNG'],
            maxSize: '10MB',
            description: 'Upload your degree certificate',
            verificationRequired: true,
          },
          TRANSCRIPT: {
            allowedFormats: ['PDF', 'JPG', 'PNG'],
            maxSize: '10MB',
            description: 'Upload your academic transcript',
            verificationRequired: true,
          },
          ID_DOCUMENT: {
            allowedFormats: ['PDF', 'JPG', 'PNG'],
            maxSize: '10MB',
            description: 'Upload government-issued ID',
            verificationRequired: true,
            note: 'Ensure all information is clearly visible',
          },
          BUSINESS_LICENSE: {
            allowedFormats: ['PDF', 'JPG', 'PNG'],
            maxSize: '10MB',
            description: 'Upload business license',
            verificationRequired: true,
          },
          COMPANY_REGISTRATION: {
            allowedFormats: ['PDF', 'JPG', 'PNG'],
            maxSize: '10MB',
            description: 'Upload company registration certificate',
            verificationRequired: true,
          },
          PORTFOLIO: {
            allowedFormats: ['PDF', 'ZIP', 'JPG', 'PNG', 'DOC', 'DOCX'],
            maxSize: '50MB',
            description: 'Upload your portfolio or work samples',
            verificationRequired: false,
            note: 'ZIP files can contain multiple portfolio items',
          },
          COVER_LETTER: {
            allowedFormats: ['PDF', 'DOC', 'DOCX', 'TXT'],
            maxSize: '10MB',
            description: 'Upload your cover letter',
            verificationRequired: false,
          },
          RECOMMENDATION_LETTER: {
            allowedFormats: ['PDF', 'DOC', 'DOCX'],
            maxSize: '10MB',
            description: 'Upload recommendation letter',
            verificationRequired: false,
            note: 'Letter should be from a professional reference',
          },
          COMPANY_LOGO: {
            allowedFormats: ['JPG', 'PNG', 'WEBP'],
            maxSize: '5MB',
            description: 'Upload company logo',
            verificationRequired: false,
            note: 'Images will be optimized for web use',
          },
          RESUME: {
            allowedFormats: ['PDF', 'DOC', 'DOCX'],
            maxSize: '5MB',
            description: 'Upload your latest resume or CV',
            verificationRequired: false,
          },
          PROFILE_PICTURE: {
            allowedFormats: ['JPG', 'PNG', 'WEBP'],
            maxSize: '5MB',
            description: 'Upload a professional profile picture',
            verificationRequired: false,
            note: 'Images will be automatically resized to 400x400 pixels',
          },
        },
        general: {
          maxFileSize:
            '50MB (for portfolios), 10MB (for documents), 5MB (for images)',
          securityNote: 'All documents are securely stored and encrypted',
          verificationNote:
            'Some documents require verification before approval',
          supportedFeatures: [
            'Bulk upload for multiple documents',
            'Automatic file validation',
            'Cloud storage with CDN',
            'Document verification system',
            'Usage statistics and analytics',
          ],
        },
      },
    };
  }

  // ================= HELPER METHODS =================

  private formatDocumentResponse(document: any) {
    return {
      id: document.id,
      documentType: document.documentType,
      originalName: document.originalName,
      url: document.cloudinaryUrl,
      fileSize: document.fileSize,
      fileSizeMB: (document.fileSize / (1024 * 1024)).toFixed(2),
      uploadedAt: document.uploadedAt,
      verificationStatus: document.verificationStatus,
      isVerified: document.isVerified,
      verificationNotes: document.verificationNotes,
    };
  }
}
