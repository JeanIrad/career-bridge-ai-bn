import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UploadService } from './upload.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadDocumentQueryDto } from './dto/documents.dto';

const multerConfig = {
  storage: diskStorage({
    destination: './uploads/temp',
    filename: (req, file, callback) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};

@ApiTags('File Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

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
      document: {
        id: document.id,
        originalName: document.originalName,
        url: document.cloudinaryUrl,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt,
        verificationStatus: document.verificationStatus,
      },
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
      document: {
        id: document.id,
        originalName: document.originalName,
        url: document.cloudinaryUrl,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt,
      },
    };
  }

  @ApiOperation({ summary: 'Get user documents' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
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
      documents: documents.map((doc) => ({
        id: doc.id,
        documentType: doc.documentType,
        originalName: doc.originalName,
        url: doc.cloudinaryUrl,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt,
        verificationStatus: doc.verificationStatus,
        isVerified: doc.isVerified,
        verificationNotes: doc.verificationNotes,
      })),
    };
  }

  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
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

  @ApiOperation({ summary: 'Get upload guidelines' })
  @ApiResponse({ status: 200, description: 'Upload guidelines retrieved' })
  @Get('guidelines')
  async getUploadGuidelines() {
    return {
      message: 'Upload guidelines retrieved successfully',
      guidelines: {
        resume: {
          allowedFormats: ['PDF', 'DOC', 'DOCX'],
          maxSize: '5MB',
          description: 'Upload your latest resume or CV',
        },
        profilePicture: {
          allowedFormats: ['JPG', 'PNG', 'WEBP'],
          maxSize: '5MB',
          description: 'Upload a professional profile picture',
          note: 'Images will be automatically resized to 400x400 pixels',
        },
        general: {
          maxFileSize: '10MB',
          note: 'All documents are securely stored and may require verification',
        },
      },
    };
  }
}
