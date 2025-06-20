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
   * Upload portfolio
   */
  async uploadPortfolio(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.validatePortfolioFile(file);

    const folder = `career-bridge/portfolios/${userId}`;
    const uploadResult = await this.uploadToCloudinary(
      file.path,
      folder,
      'auto',
      {
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'zip', 'doc', 'docx'],
      },
    );

    const document = await this.prisma.document.create({
      data: {
        userId,
        documentType: DocumentType.PORTFOLIO,
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
   * Upload cover letter
   */
  async uploadCoverLetter(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.validateDocumentFile(file);

    const folder = `career-bridge/cover-letters/${userId}`;
    const uploadResult = await this.uploadToCloudinary(
      file.path,
      folder,
      'raw',
      {
        allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
      },
    );

    const document = await this.prisma.document.create({
      data: {
        userId,
        documentType: DocumentType.COVER_LETTER,
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
   * Upload recommendation letter
   */
  async uploadRecommendationLetter(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.validateDocumentFile(file);

    const folder = `career-bridge/recommendation-letters/${userId}`;
    const uploadResult = await this.uploadToCloudinary(
      file.path,
      folder,
      'raw',
      {
        allowed_formats: ['pdf', 'doc', 'docx'],
      },
    );

    const document = await this.prisma.document.create({
      data: {
        userId,
        documentType: DocumentType.RECOMMENDATION_LETTER,
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
   * Upload multiple documents at once
   */
  async uploadMultipleDocuments(
    userId: string,
    files: Express.Multer.File[],
    documentType: DocumentType,
  ): Promise<Document[]> {
    const documents: Document[] = [];

    for (const file of files) {
      let document: Document;

      switch (documentType) {
        case DocumentType.PORTFOLIO:
          document = await this.uploadPortfolio(userId, file);
          break;
        case DocumentType.COVER_LETTER:
          document = await this.uploadCoverLetter(userId, file);
          break;
        case DocumentType.RECOMMENDATION_LETTER:
          document = await this.uploadRecommendationLetter(userId, file);
          break;
        case DocumentType.DEGREE_CERTIFICATE:
          document = await this.uploadDegreeCertificate(userId, file);
          break;
        case DocumentType.TRANSCRIPT:
          document = await this.uploadTranscript(userId, file);
          break;
        case DocumentType.ID_DOCUMENT:
          document = await this.uploadIdDocument(userId, file);
          break;
        case DocumentType.BUSINESS_LICENSE:
          document = await this.uploadBusinessLicense(userId, file);
          break;
        case DocumentType.COMPANY_REGISTRATION:
          document = await this.uploadCompanyRegistration(userId, file);
          break;
        case DocumentType.COMPANY_LOGO:
          document = await this.uploadCompanyLogo(userId, file);
          break;
        default:
          throw new BadRequestException(
            `Unsupported document type: ${documentType}`,
          );
      }

      documents.push(document);
    }

    return documents;
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

  /**
   * Get document statistics for user
   */
  async getDocumentStatistics(userId: string): Promise<{
    totalDocuments: number;
    verifiedDocuments: number;
    pendingDocuments: number;
    documentsByType: { [key in DocumentType]?: number };
    storageUsed: number; // in bytes
  }> {
    const documents = await this.prisma.document.findMany({
      where: { userId, deletedAt: null },
      select: {
        documentType: true,
        verificationStatus: true,
        fileSize: true,
      },
    });

    const stats = {
      totalDocuments: documents.length,
      verifiedDocuments: documents.filter(
        (d) => d.verificationStatus === VerificationStatus.APPROVED,
      ).length,
      pendingDocuments: documents.filter(
        (d) => d.verificationStatus === VerificationStatus.PENDING,
      ).length,
      documentsByType: {} as { [key in DocumentType]?: number },
      storageUsed: documents.reduce((total, doc) => total + doc.fileSize, 0),
    };

    // Count documents by type
    for (const doc of documents) {
      stats.documentsByType[doc.documentType] =
        (stats.documentsByType[doc.documentType] || 0) + 1;
    }

    return stats;
  }

  /**
   * Bulk delete documents
   */
  async bulkDeleteDocuments(
    userId: string,
    documentIds: string[],
  ): Promise<void> {
    // Get documents to delete (ensure they belong to the user)
    const documents = await this.prisma.document.findMany({
      where: {
        id: { in: documentIds },
        userId,
        deletedAt: null,
      },
    });

    if (documents.length !== documentIds.length) {
      throw new BadRequestException(
        'Some documents not found or do not belong to user',
      );
    }

    // Delete from Cloudinary
    for (const document of documents) {
      try {
        await cloudinary.uploader.destroy(document.cloudinaryPublicId);
      } catch (error) {
        this.logger.warn(
          `Failed to delete from Cloudinary: ${document.cloudinaryPublicId}`,
          error,
        );
      }
    }

    // Soft delete from database
    await this.prisma.document.updateMany({
      where: {
        id: { in: documentIds },
        userId,
      },
      data: {
        deletedAt: new Date(),
      },
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

  /**
   * Validate portfolio file
   */
  private validatePortfolioFile(file: Express.Multer.File): void {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Portfolio must be PDF, DOC, DOCX, ZIP, JPG, or PNG',
      );
    }

    const maxSize = 50 * 1024 * 1024; // 50MB for portfolios
    if (file.size > maxSize) {
      throw new BadRequestException(
        'Portfolio file too large. Maximum size is 50MB',
      );
    }
  }

  /**
   * Validate document file (for cover letters, recommendation letters, etc.)
   */
  private validateDocumentFile(file: Express.Multer.File): void {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Document must be PDF, DOC, DOCX, or TXT',
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'Document file too large. Maximum size is 10MB',
      );
    }
  }
}
