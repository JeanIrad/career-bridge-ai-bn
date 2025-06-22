import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import {
  Company,
  User,
  Document,
  VerificationStatus,
  DocumentType,
  UserRole,
} from '@prisma/client';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyQueryDto,
} from './dto/company.dto';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  // ============= COMPANY MANAGEMENT =============

  async createCompany(
    userId: string,
    createCompanyDto: CreateCompanyDto,
  ): Promise<Company> {
    // Check if user is an employer
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true, firstName: true, lastName: true },
    });

    if (!user || user.role !== UserRole.EMPLOYER) {
      throw new ForbiddenException('Only employers can create companies');
    }

    // Create company with location
    const company = await this.prisma.company.create({
      data: {
        name: createCompanyDto.name,
        description: createCompanyDto.description || '',
        industry: createCompanyDto.industry,
        size: createCompanyDto.size,
        website: createCompanyDto.website,
        type: createCompanyDto.type || 'Private',
        foundedYear: createCompanyDto.foundedYear,
        specializations: createCompanyDto.specializations || [],
        phone: createCompanyDto.phone,
        email: createCompanyDto.email,
        linkedIn: createCompanyDto.linkedIn,
        twitter: createCompanyDto.twitter,
        facebook: createCompanyDto.facebook,
        ownerId: userId,
        isVerified: false, // New companies need admin approval
        locations: {
          create: {
            address: createCompanyDto.address,
            city: createCompanyDto.city,
            state: createCompanyDto.state,
            country: createCompanyDto.country,
            zipCode: createCompanyDto.zipCode,
            countryCode: createCompanyDto.countryCode,
            isHeadquarters: true,
            locationType: 'headquarters',
          },
        },
      },
      include: {
        locations: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        documents: {
          where: { deletedAt: null },
        },
      },
    });

    this.logger.log(`Company created: ${company.name} by user ${userId}`);
    return company;
  }

  async getEmployerCompanies(
    userId: string,
    query?: CompanyQueryDto,
  ): Promise<{
    companies: Company[];
    total: number;
    pagination?: any;
  }> {
    const { search, verified, page = 1, limit = 10 } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {
      ownerId: userId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (verified !== undefined) {
      where.isVerified = verified;
    }

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          locations: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          documents: {
            where: { deletedAt: null },
            select: {
              id: true,
              documentType: true,
              verificationStatus: true,
              uploadedAt: true,
            },
          },
          _count: {
            select: {
              jobs: true,
              experiences: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      companies,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getCompanyById(companyId: string, userId?: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, deletedAt: null },
      include: {
        locations: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        documents: {
          where: { deletedAt: null },
          select: {
            id: true,
            documentType: true,
            originalName: true,
            cloudinaryUrl: true,
            verificationStatus: true,
            uploadedAt: true,
            verificationNotes: true,
          },
        },
        jobs: {
          where: { deletedAt: null, status: 'ACTIVE' },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            type: true,
            location: true,
            createdAt: true,
            _count: {
              select: {
                applications: true,
              },
            },
          },
        },
        reviews: {
          where: { deletedAt: null },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            jobs: true,
            experiences: true,
            reviews: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if user has access to view sensitive information
    const isOwner = userId && company.ownerId === userId;
    const isAdmin = userId && (await this.isAdmin(userId));

    if (!isOwner && !isAdmin && !company.isVerified) {
      throw new ForbiddenException('Company not verified');
    }

    return company;
  }

  async updateCompany(
    companyId: string,
    userId: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own companies');
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        name: updateCompanyDto.name,
        description: updateCompanyDto.description,
        industry: updateCompanyDto.industry,
        size: updateCompanyDto.size,
        website: updateCompanyDto.website,
        type: updateCompanyDto.type,
        foundedYear: updateCompanyDto.foundedYear,
        specializations: updateCompanyDto.specializations,
        phone: updateCompanyDto.phone,
        email: updateCompanyDto.email,
        linkedIn: updateCompanyDto.linkedIn,
        twitter: updateCompanyDto.twitter,
        facebook: updateCompanyDto.facebook,
        // Reset verification if significant changes are made
        isVerified: this.shouldResetVerification(updateCompanyDto)
          ? false
          : company.isVerified,
      },
      include: {
        locations: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        documents: {
          where: { deletedAt: null },
        },
      },
    });

    // Update headquarters location if provided
    if (
      updateCompanyDto.address ||
      updateCompanyDto.city ||
      updateCompanyDto.state ||
      updateCompanyDto.country
    ) {
      await this.prisma.companyLocation.updateMany({
        where: { companyId, isHeadquarters: true },
        data: {
          address: updateCompanyDto.address,
          city: updateCompanyDto.city,
          state: updateCompanyDto.state,
          country: updateCompanyDto.country,
          zipCode: updateCompanyDto.zipCode,
          countryCode: updateCompanyDto.countryCode,
        },
      });
    }

    this.logger.log(
      `Company updated: ${updatedCompany.name} by user ${userId}`,
    );
    return updatedCompany;
  }

  async deleteCompany(companyId: string, userId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, deletedAt: null },
      include: {
        jobs: { where: { deletedAt: null } },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own companies');
    }

    // Check if company has active jobs
    if (company.jobs.length > 0) {
      throw new BadRequestException(
        'Cannot delete company with active job postings',
      );
    }

    await this.prisma.company.update({
      where: { id: companyId },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Company deleted: ${company.name} by user ${userId}`);
  }

  // ============= DOCUMENT MANAGEMENT =============

  async getCompanyDocuments(
    companyId: string,
    userId: string,
  ): Promise<Document[]> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId !== userId && !(await this.isAdmin(userId))) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.document.findMany({
      where: {
        userId: company.ownerId,
        documentType: {
          in: [
            DocumentType.BUSINESS_LICENSE,
            DocumentType.COMPANY_REGISTRATION,
            DocumentType.COMPANY_LOGO,
            DocumentType.ID_DOCUMENT,
          ],
        },
        deletedAt: null,
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async uploadCompanyDocument(
    companyId: string,
    userId: string,
    file: Express.Multer.File,
    documentType: DocumentType,
  ): Promise<Document> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId !== userId) {
      throw new ForbiddenException(
        'You can only upload documents for your own companies',
      );
    }

    // Use appropriate upload service method based on document type
    let document: Document;
    switch (documentType) {
      case DocumentType.BUSINESS_LICENSE:
        document = await this.uploadService.uploadBusinessLicense(userId, file);
        break;
      case DocumentType.COMPANY_REGISTRATION:
        document = await this.uploadService.uploadCompanyRegistration(
          userId,
          file,
        );
        break;
      case DocumentType.COMPANY_LOGO:
        document = await this.uploadService.uploadCompanyLogo(userId, file);
        // Update company logo URL
        await this.prisma.company.update({
          where: { id: companyId },
          data: { logo: document.cloudinaryUrl },
        });
        break;
      case DocumentType.ID_DOCUMENT:
        document = await this.uploadService.uploadIdDocument(userId, file);
        break;
      default:
        throw new BadRequestException('Invalid document type for company');
    }

    this.logger.log(
      `Document uploaded for company ${companyId}: ${documentType}`,
    );
    return document;
  }

  // ============= ADMIN OPERATIONS =============

  async getAllCompaniesForAdmin(query?: CompanyQueryDto): Promise<{
    companies: Company[];
    total: number;
    pagination?: any;
  }> {
    const { search, verified, page = 1, limit = 10 } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
        {
          owner: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (verified !== undefined) {
      where.isVerified = verified;
    }

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          locations: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          documents: {
            where: { deletedAt: null },
            select: {
              id: true,
              documentType: true,
              verificationStatus: true,
              uploadedAt: true,
              verificationNotes: true,
            },
          },
          _count: {
            select: {
              jobs: true,
              experiences: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      companies,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async verifyCompany(
    companyId: string,
    adminId: string,
    isApproved: boolean,
    notes?: string,
  ): Promise<Company> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId, deletedAt: null },
      include: {
        owner: true,
        documents: {
          where: { deletedAt: null },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Update company verification status
    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: { isVerified: isApproved },
      include: {
        locations: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        documents: {
          where: { deletedAt: null },
        },
      },
    });

    // Update document verification statuses
    if (company.documents.length > 0) {
      await this.prisma.document.updateMany({
        where: {
          userId: company.ownerId,
          documentType: {
            in: [
              DocumentType.BUSINESS_LICENSE,
              DocumentType.COMPANY_REGISTRATION,
              DocumentType.ID_DOCUMENT,
            ],
          },
          deletedAt: null,
        },
        data: {
          verificationStatus: isApproved
            ? VerificationStatus.APPROVED
            : VerificationStatus.REJECTED,
          verificationNotes: notes,
          verifiedAt: new Date(),
          verifiedBy: adminId,
        },
      });
    }

    // Send notification to company owner
    await this.sendVerificationNotification(company, isApproved, notes);

    this.logger.log(
      `Company ${isApproved ? 'approved' : 'rejected'}: ${company.name} by admin ${adminId}`,
    );
    return updatedCompany;
  }

  // ============= HELPER METHODS =============

  private async isAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  }

  private shouldResetVerification(updateDto: UpdateCompanyDto): boolean {
    // Reset verification if critical information is changed
    const criticalFields = ['name', 'industry', 'email', 'website'];
    return criticalFields.some((field) => updateDto[field] !== undefined);
  }

  private async sendVerificationNotification(
    company: Company & { owner: User },
    isApproved: boolean,
    notes?: string,
  ): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId: company.ownerId,
          title: `Company ${isApproved ? 'Approved' : 'Rejected'}`,
          content: isApproved
            ? `Your company "${company.name}" has been approved and is now verified.`
            : `Your company "${company.name}" verification was rejected. ${notes || ''}`,
          type: 'COMPANY_VERIFICATION',
          priority: 'HIGH',
          metadata: {
            companyId: company.id,
            companyName: company.name,
            status: isApproved ? 'approved' : 'rejected',
            notes,
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to send verification notification:', error);
    }
  }
}
