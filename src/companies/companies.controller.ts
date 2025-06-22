import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, DocumentType } from '@prisma/client';
import { CompaniesService } from './companies.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyQueryDto,
  CompanyVerificationDto,
  CompanyDocumentUploadDto,
  BulkCompanyActionDto,
} from './dto/company.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';

const multerConfig = {
  storage: diskStorage({
    destination: './uploads/temp',
    filename: (req, file, callback) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
};

@ApiTags('Company Management')
@Controller('companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // ============= EMPLOYER ENDPOINTS =============

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Employer role required',
  })
  async createCompany(
    @CurrentUser() user: any,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    try {
      const company = await this.companiesService.createCompany(
        user.id,
        createCompanyDto,
      );
      return {
        success: true,
        message: 'Company created successfully',
        data: company,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create company',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('my-companies')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({ summary: 'Get all companies owned by current user' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({
    name: 'verified',
    required: false,
    description: 'Filter by verification status',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  async getMyCompanies(
    @CurrentUser() user: any,
    @Query() query: CompanyQueryDto,
  ) {
    try {
      const result = await this.companiesService.getEmployerCompanies(
        user.id,
        query,
      );
      return {
        success: true,
        message: 'Companies retrieved successfully',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve companies',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getCompanyById(
    @Param('id') companyId: string,
    @CurrentUser() user?: any,
  ) {
    try {
      const company = await this.companiesService.getCompanyById(
        companyId,
        user?.id,
      );
      return {
        success: true,
        message: 'Company retrieved successfully',
        data: company,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve company',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({ summary: 'Update company information' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not company owner' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async updateCompany(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    try {
      const company = await this.companiesService.updateCompany(
        companyId,
        user.id,
        updateCompanyDto,
      );
      return {
        success: true,
        message: 'Company updated successfully',
        data: company,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update company',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({ summary: 'Delete company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not company owner' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async deleteCompany(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ) {
    try {
      await this.companiesService.deleteCompany(companyId, user.id);
      return {
        success: true,
        message: 'Company deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete company',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ============= DOCUMENT MANAGEMENT =============

  @Get(':id/documents')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all documents for a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async getCompanyDocuments(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const documents = await this.companiesService.getCompanyDocuments(
        companyId,
        user.id,
      );
      return {
        success: true,
        message: 'Documents retrieved successfully',
        data: documents,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve documents',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/documents/upload')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload document for company' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file to upload',
        },
        documentType: {
          type: 'string',
          enum: Object.values(DocumentType),
          description: 'Type of document being uploaded',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  async uploadCompanyDocument(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { documentType: DocumentType },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!body.documentType) {
      throw new BadRequestException('Document type is required');
    }

    // Validate document type for companies
    const allowedTypes: DocumentType[] = [
      DocumentType.BUSINESS_LICENSE,
      DocumentType.COMPANY_REGISTRATION,
      DocumentType.COMPANY_LOGO,
      DocumentType.ID_DOCUMENT,
    ];

    if (!allowedTypes.includes(body.documentType)) {
      throw new BadRequestException(
        `Invalid document type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    try {
      const document = await this.companiesService.uploadCompanyDocument(
        companyId,
        user.id,
        file,
        body.documentType,
      );

      return {
        success: true,
        message: 'Document uploaded successfully',
        data: {
          id: document.id,
          documentType: document.documentType,
          originalName: document.originalName,
          url: document.cloudinaryUrl,
          fileSize: document.fileSize,
          fileSizeMB: (document.fileSize / (1024 * 1024)).toFixed(2),
          uploadedAt: document.uploadedAt,
          verificationStatus: document.verificationStatus,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to upload document',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ============= ADMIN ENDPOINTS =============

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all companies (Admin only)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({
    name: 'verified',
    required: false,
    description: 'Filter by verification status',
  })
  @ApiQuery({
    name: 'industry',
    required: false,
    description: 'Filter by industry',
  })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({
    name: 'country',
    required: false,
    description: 'Filter by country',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  async getAllCompanies(@Query() query: CompanyQueryDto) {
    try {
      const result = await this.companiesService.getAllCompaniesForAdmin(query);
      return {
        success: true,
        message: 'Companies retrieved successfully',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve companies',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Verify or reject company (Admin only)' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Company verification updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async verifyCompany(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
    @Body() verificationDto: CompanyVerificationDto,
  ) {
    try {
      const company = await this.companiesService.verifyCompany(
        companyId,
        user.id,
        verificationDto.isApproved,
        verificationDto.notes,
      );
      return {
        success: true,
        message: `Company ${verificationDto.isApproved ? 'approved' : 'rejected'} successfully`,
        data: company,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update company verification',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('bulk-action')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Perform bulk action on companies (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Bulk action completed successfully',
  })
  async bulkCompanyAction(
    @CurrentUser() user: any,
    @Body() bulkActionDto: BulkCompanyActionDto,
  ) {
    try {
      const results: Array<{
        companyId: string;
        status: string;
        company?: any;
        error?: string;
      }> = [];

      for (const companyId of bulkActionDto.companyIds) {
        try {
          switch (bulkActionDto.action) {
            case 'approve':
              const approvedCompany = await this.companiesService.verifyCompany(
                companyId,
                user.id,
                true,
                bulkActionDto.notes,
              );
              results.push({
                companyId,
                status: 'approved',
                company: approvedCompany,
              });
              break;
            case 'reject':
              const rejectedCompany = await this.companiesService.verifyCompany(
                companyId,
                user.id,
                false,
                bulkActionDto.notes,
              );
              results.push({
                companyId,
                status: 'rejected',
                company: rejectedCompany,
              });
              break;
            case 'delete':
              await this.companiesService.deleteCompany(companyId, user.id);
              results.push({ companyId, status: 'deleted' });
              break;
            default:
              results.push({
                companyId,
                status: 'error',
                error: 'Invalid action',
              });
          }
        } catch (error) {
          results.push({ companyId, status: 'error', error: error.message });
        }
      }

      const successCount = results.filter((r) => r.status !== 'error').length;
      const errorCount = results.filter((r) => r.status === 'error').length;

      return {
        success: true,
        message: `Bulk action completed. ${successCount} successful, ${errorCount} failed.`,
        data: {
          results,
          summary: {
            total: bulkActionDto.companyIds.length,
            successful: successCount,
            failed: errorCount,
          },
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to perform bulk action',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ============= PUBLIC ENDPOINTS =============

  @Get('public/search')
  @ApiOperation({ summary: 'Search verified companies (Public)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({
    name: 'industry',
    required: false,
    description: 'Filter by industry',
  })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({
    name: 'country',
    required: false,
    description: 'Filter by country',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  async searchPublicCompanies(@Query() query: CompanyQueryDto) {
    try {
      // Force verified filter for public searches
      const publicQuery = { ...query, verified: true };
      const result =
        await this.companiesService.getAllCompaniesForAdmin(publicQuery);

      // Remove sensitive information for public view
      const sanitizedCompanies = result.companies.map((company: any) => ({
        id: company.id,
        name: company.name,
        description: company.description,
        logo: company.logo,
        website: company.website,
        industry: company.industry,
        size: company.size,
        type: company.type,
        foundedYear: company.foundedYear,
        specializations: company.specializations,
        isVerified: company.isVerified,
        locations: company.locations?.map((loc: any) => ({
          city: loc.city,
          state: loc.state,
          country: loc.country,
          isHeadquarters: loc.isHeadquarters,
        })),
        _count: company._count,
      }));

      return {
        success: true,
        message: 'Companies retrieved successfully',
        companies: sanitizedCompanies,
        total: result.total,
        pagination: result.pagination,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to search companies',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
