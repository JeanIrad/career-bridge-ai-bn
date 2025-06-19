import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import { DocumentType, VerificationStatus, Document } from '@prisma/client';

export interface UploadResult {
  public_id: string;
  secure_url: string;
  original_filename: string;
  bytes: number;
  format: string;
  resource_type: string;
  folder: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadToCloudinary(
    filePath: string,
    folder: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto',
    options: any = {},
  ): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        ...options,
      });

      // Clean up temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        original_filename: result.original_filename,
        bytes: result.bytes,
        format: result.format,
        resource_type: result.resource_type,
        folder: result.folder,
      };
    } catch (error) {
      this.logger.error('Cloudinary upload failed:', error);

      // Clean up temporary file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      throw new BadRequestException('File upload failed');
    }
  }

  /**
   * Upload resume
   */
  async uploadResume(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.validateResumeFile(file);

    const folder = `career-bridge/resumes/${userId}`;
    const uploadResult = await this.uploadToCloudinary(
      file.path,
      folder,
      'raw',
    );

    // Save to database
    const document = await this.prisma.document.create({
      data: {
        userId,
        documentType: DocumentType.RESUME,
        originalName: file.originalname,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        fileSize: uploadResult.bytes,
        mimeType: file.mimetype,
        isVerified: false,
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    // Update user's resume URL
    await this.prisma.user.update({
      where: { id: userId },
      data: { resume: uploadResult.secure_url },
    });

    return document;
  }

  /**
   * Upload degree certificate
   */
  async uploadDegreeCertificate(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.validateCertificateFile(file);

    const folder = `career-bridge/certificates/${userId}`;
    const uploadResult = await this.uploadToCloudinary(
      file.path,
      folder,
      'raw',
      {
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
      },
    );

    const document = await this.prisma.document.create({
      data: {
        userId,
        documentType: DocumentType.DEGREE_CERTIFICATE,
        originalName: file.originalname,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        fileSize: uploadResult.bytes,
        mimeType: file.mimetype,
        isVerified: false,
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    return document;
  }

  /**
   * Upload transcript
   */
  async uploadTranscript(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.validateTranscriptFile(file);

    const folder = `career-bridge/transcripts/${userId}`;
    const uploadResult = await this.uploadToCloudinary(
      file.path,
      folder,
      'raw',
      {
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
      },
    );

    const document = await this.prisma.document.create({
      data: {
        userId,
        documentType: DocumentType.TRANSCRIPT,
        originalName: file.originalname,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        fileSize: uploadResult.bytes,
        mimeType: file.mimetype,
        isVerified: false,
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    return document;
  }

  /**
   * Upload ID document
   */
  async uploadIdDocument(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.validateIdFile(file);

    const folder = `career-bridge/id-documents/${userId}`;
    const uploadResult = await this.uploadToCloudinary(
      file.path,
      folder,
      'raw',
      {
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
      },
    );

    const document = await this.prisma.document.create({
      data: {
        userId,
        documentType: DocumentType.ID_DOCUMENT,
        originalName: file.originalname,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        fileSize: uploadResult.bytes,
        mimeType: file.mimetype,
        isVerified: false,
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    return document;
  }

  /**
   * Upload business license (for employers)
   */
  async uploadBusinessLicense(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.validateBusinessFile(file);

    const folder = `career-bridge/business-licenses/${userId}`;
    const uploadResult = await this.uploadToCloudinary(
      file.path,
      folder,
      'raw',
      {
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
      },
    );

    const document = await this.prisma.document.create({
      data: {
        userId,
        documentType: DocumentType.BUSINESS_LICENSE,
        originalName: file.originalname,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        fileSize: uploadResult.bytes,
        mimeType: file.mimetype,
        isVerified: false,
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    return document;
  }

  /**
   * Upload company registration
   */
  async uploadCompanyRegistration(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.validateBusinessFile(file);

    const folder = `career-bridge/company-registrations/${userId}`;
    const uploadResult = await this.uploadToCloudinary(
      file.path,
      folder,
      'raw',
      {
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
      },
    );

    const document = await this.prisma.document.create({
      data: {
        userId,
        documentType: DocumentType.COMPANY_REGISTRATION,
        originalName: file.originalname,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        fileSize: uploadResult.bytes,
        mimeType: file.mimetype,
        isVerified: false,
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    return document;
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.validateImageFile(file);

    const folder = `career-bridge/profile-pictures/${userId}`;
    const uploadResult = await this.uploadToCloudinary(
      file.path,
      folder,
      'image',
      {
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
    );

    const document = await this.prisma.document.create({
      data: {
        userId,
        documentType: DocumentType.PROFILE_PICTURE,
        originalName: file.originalname,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        fileSize: uploadResult.bytes,
        mimeType: file.mimetype,
        isVerified: true, // Profile pictures don't need verification
        verificationStatus: VerificationStatus.APPROVED,
      },
    });

    // Update user's avatar
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: uploadResult.secure_url },
    });

    return document;
  }

  /**
   * Upload company logo
   */
  async uploadCompanyLogo(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.validateImageFile(file);

    const folder = `career-bridge/company-logos/${userId}`;
    const uploadResult = await this.uploadToCloudinary(
      file.path,
      folder,
      'image',
      {
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
        transformation: [
          { width: 300, height: 300, crop: 'fit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
    );

    const document = await this.prisma.document.create({
      data: {
        userId,
        documentType: DocumentType.COMPANY_LOGO,
        originalName: file.originalname,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        fileSize: uploadResult.bytes,
        mimeType: file.mimetype,
        isVerified: true, // Company logos don't need verification
        verificationStatus: VerificationStatus.APPROVED,
      },
    });

    return document;
  }

  /**
   * Get user documents
   */
  async getUserDocuments(
    userId: string,
    documentType?: DocumentType,
  ): Promise<Document[]> {
    const whereClause: any = { userId };
    if (documentType) {
      whereClause.documentType = documentType;
    }

    return this.prisma.document.findMany({
      where: whereClause,
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Delete document
   */
  async deleteDocument(userId: string, documentId: string): Promise<void> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    try {
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(document.cloudinaryPublicId);
    } catch (error) {
      this.logger.warn('Failed to delete from Cloudinary:', error);
    }

    // Delete from database
    await this.prisma.document.delete({
      where: { id: documentId },
    });
  }

  /**
   * Verify document (admin only)
   */
  async verifyDocument(
    documentId: string,
    verificationStatus: VerificationStatus,
    verificationNotes?: string,
  ): Promise<Document> {
    return this.prisma.document.update({
      where: { id: documentId },
      data: {
        verificationStatus,
        verificationNotes,
        isVerified: verificationStatus === VerificationStatus.APPROVED,
      },
    });
  }

  /**
   * Get documents pending verification
   */
  async getPendingDocuments(): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { uploadedAt: 'asc' },
    });
  }

  // ============= VALIDATION METHODS =============

  private validateResumeFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF, DOC, and DOCX files are allowed for resumes.',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      throw new BadRequestException('Resume file size must be less than 5MB');
    }
  }

  private validateCertificateFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed for certificates.',
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      throw new BadRequestException(
        'Certificate file size must be less than 10MB',
      );
    }
  }

  private validateTranscriptFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed for transcripts.',
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      throw new BadRequestException(
        'Transcript file size must be less than 10MB',
      );
    }
  }

  private validateIdFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed for ID documents.',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      throw new BadRequestException(
        'ID document file size must be less than 5MB',
      );
    }
  }

  private validateBusinessFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed for business documents.',
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      throw new BadRequestException(
        'Business document file size must be less than 10MB',
      );
    }
  }

  private validateImageFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPG, JPEG, PNG, and WEBP files are allowed for images.',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      throw new BadRequestException('Image file size must be less than 5MB');
    }
  }
}
