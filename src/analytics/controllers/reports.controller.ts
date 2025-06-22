import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { ReportsService } from '../services/reports.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsString, IsObject, IsEnum, IsOptional } from 'class-validator';

class GenerateReportDto {
  @IsString()
  templateId: string;

  @IsObject()
  parameters: Record<string, any>;

  @IsOptional()
  @IsEnum(['json', 'pdf', 'excel', 'csv'])
  format?: 'json' | 'pdf' | 'excel' | 'csv';
}

class ReportQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  limit?: number;
}

@ApiTags('Reports & Analytics')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({
    summary: 'Get available report templates',
    description:
      'Retrieve list of report templates available to the user based on their role',
  })
  @ApiResponse({
    status: 200,
    description: 'Report templates retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              type: { type: 'string' },
              frequency: { type: 'string' },
              parameters: { type: 'array' },
              roles: { type: 'array' },
            },
          },
        },
      },
    },
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by report category',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Filter by report type',
  })
  @ApiQuery({
    name: 'frequency',
    required: false,
    type: String,
    description: 'Filter by report frequency',
  })
  @Get('templates')
  async getReportTemplates(@Query() query: ReportQueryDto, @Request() req) {
    const userRole = req.user.role as UserRole;

    try {
      let templates = await this.reportsService.getReportTemplates(userRole);

      // Apply filters
      if (query.category) {
        templates = templates.filter((t) => t.category === query.category);
      }
      if (query.type) {
        templates = templates.filter((t) => t.type === query.type);
      }
      if (query.frequency) {
        templates = templates.filter((t) => t.frequency === query.frequency);
      }

      return {
        message: 'Report templates retrieved successfully',
        templates,
        totalCount: templates.length,
        userRole,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve report templates: ${error.message}`,
      );
    }
  }

  @ApiOperation({
    summary: 'Generate a report',
    description:
      'Generate a report based on a template with specified parameters',
  })
  @ApiResponse({
    status: 201,
    description: 'Report generated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        report: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            templateId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            generatedBy: { type: 'string' },
            generatedAt: { type: 'string', format: 'date-time' },
            format: { type: 'string' },
            size: { type: 'number' },
            downloadUrl: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiBody({
    type: GenerateReportDto,
    description: 'Report generation parameters',
    examples: {
      userEngagementReport: {
        summary: 'User Engagement Report',
        value: {
          templateId: 'user-engagement-report',
          parameters: {
            dateRange: {
              startDate: '2024-01-01T00:00:00.000Z',
              endDate: '2024-03-31T23:59:59.999Z',
            },
            userRole: 'STUDENT',
          },
          format: 'json',
        },
      },
      jobMarketAnalysis: {
        summary: 'Job Market Analysis',
        value: {
          templateId: 'job-market-analysis',
          parameters: {
            dateRange: {
              startDate: '2024-01-01T00:00:00.000Z',
              endDate: '2024-03-31T23:59:59.999Z',
            },
            industry: ['Technology', 'Healthcare'],
          },
          format: 'pdf',
        },
      },
    },
  })
  @Post('generate')
  async generateReport(@Body() generateDto: GenerateReportDto, @Request() req) {
    const userId = req.user.id;
    const userRole = req.user.role as UserRole;

    try {
      // Validate that user has access to this template
      const templates = await this.reportsService.getReportTemplates(userRole);
      const template = templates.find((t) => t.id === generateDto.templateId);

      if (!template) {
        throw new BadRequestException(
          'Report template not found or not accessible',
        );
      }

      // Validate required parameters
      const missingParams = template.parameters
        .filter(
          (param) => param.required && !generateDto.parameters[param.name],
        )
        .map((param) => param.name);

      if (missingParams.length > 0) {
        throw new BadRequestException(
          `Missing required parameters: ${missingParams.join(', ')}`,
        );
      }

      const report = await this.reportsService.generateReport(
        generateDto.templateId,
        generateDto.parameters,
        userId,
        generateDto.format || 'json',
      );

      return {
        message: 'Report generated successfully',
        report: {
          id: report.id,
          templateId: report.templateId,
          title: report.title,
          description: report.description,
          generatedBy: report.generatedBy,
          generatedAt: report.generatedAt,
          format: report.format,
          size: report.size,
          downloadUrl: report.downloadUrl,
        },
        estimatedProcessingTime: '2-5 minutes',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate report: ${error.message}`,
      );
    }
  }

  @ApiOperation({
    summary: "Get user's generated reports",
    description: 'Retrieve list of reports generated by the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'User reports retrieved successfully',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of reports to retrieve (default: 20)',
  })
  @Get('my-reports')
  async getUserReports(@Query() query: { limit?: number }, @Request() req) {
    const userId = req.user.id;
    const limit = query.limit || 20;

    try {
      const reports = await this.reportsService.getUserReports(userId, limit);

      return {
        message: 'User reports retrieved successfully',
        reports,
        totalCount: reports.length,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve user reports: ${error.message}`,
      );
    }
  }

  @ApiOperation({
    summary: 'Get report by ID',
    description: 'Retrieve a specific report by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Report retrieved successfully',
  })
  @ApiParam({
    name: 'reportId',
    description: 'ID of the report to retrieve',
    type: String,
  })
  @Get(':reportId')
  async getReportById(@Param('reportId') reportId: string, @Request() req) {
    const userId = req.user.id;

    try {
      // In a real implementation, this would fetch the specific report
      // and verify ownership/permissions
      const userReports = await this.reportsService.getUserReports(userId);
      const report = userReports.find((r) => r.id === reportId);

      if (!report) {
        throw new BadRequestException('Report not found or not accessible');
      }

      return {
        message: 'Report retrieved successfully',
        report,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve report: ${error.message}`,
      );
    }
  }

  @ApiOperation({
    summary: 'Delete a report',
    description: 'Delete a generated report',
  })
  @ApiResponse({
    status: 200,
    description: 'Report deleted successfully',
  })
  @ApiParam({
    name: 'reportId',
    description: 'ID of the report to delete',
    type: String,
  })
  @Delete(':reportId')
  async deleteReport(@Param('reportId') reportId: string, @Request() req) {
    const userId = req.user.id;

    try {
      await this.reportsService.deleteReport(reportId, userId);

      return {
        message: 'Report deleted successfully',
        reportId,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete report: ${error.message}`,
      );
    }
  }

  @ApiOperation({
    summary: 'Get report categories',
    description: 'Get list of available report categories and types',
  })
  @ApiResponse({
    status: 200,
    description: 'Report categories retrieved successfully',
  })
  @Get('meta/categories')
  async getReportCategories(@Request() req) {
    const userRole = req.user.role as UserRole;

    try {
      const templates = await this.reportsService.getReportTemplates(userRole);

      const categories = [...new Set(templates.map((t) => t.category))];
      const types = [...new Set(templates.map((t) => t.type))];
      const frequencies = [...new Set(templates.map((t) => t.frequency))];

      const categoryStats = categories.map((category) => ({
        category,
        count: templates.filter((t) => t.category === category).length,
        templates: templates
          .filter((t) => t.category === category)
          .map((t) => ({
            id: t.id,
            name: t.name,
            type: t.type,
            frequency: t.frequency,
          })),
      }));

      return {
        message: 'Report categories retrieved successfully',
        categories: categoryStats,
        availableTypes: types,
        availableFrequencies: frequencies,
        totalTemplates: templates.length,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve report categories: ${error.message}`,
      );
    }
  }

  @ApiOperation({
    summary: 'Get report statistics',
    description: 'Get statistics about report generation and usage',
  })
  @ApiResponse({
    status: 200,
    description: 'Report statistics retrieved successfully',
  })
  @Get('meta/statistics')
  async getReportStatistics(@Request() req) {
    const userId = req.user.id;
    const userRole = req.user.role as UserRole;

    try {
      const userReports = await this.reportsService.getUserReports(userId, 100);
      const templates = await this.reportsService.getReportTemplates(userRole);

      const statistics = {
        totalReportsGenerated: userReports.length,
        reportsThisMonth: userReports.filter((r) => {
          const reportDate = new Date(r.generatedAt!);
          const now = new Date();
          return (
            reportDate.getMonth() === now.getMonth() &&
            reportDate.getFullYear() === now.getFullYear()
          );
        }).length,
        availableTemplates: templates.length,
        mostUsedTemplate: this.getMostUsedTemplate(userReports),
        totalStorageUsed: userReports.reduce(
          (sum, r) => sum + (r.size || 0),
          0,
        ),
        reportsByFormat: this.getReportsByFormat(userReports),
        reportsByCategory: this.getReportsByCategory(userReports, templates),
      };

      return {
        message: 'Report statistics retrieved successfully',
        statistics,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve report statistics: ${error.message}`,
      );
    }
  }

  // Helper methods
  private getMostUsedTemplate(
    reports: any[],
  ): { templateId: string; count: number } | null {
    if (reports.length === 0) return null;

    const templateCounts = reports.reduce(
      (acc, report) => {
        acc[report.templateId] = (acc[report.templateId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostUsed = Object.entries(templateCounts).reduce(
      (max, [templateId, count]) =>
        (count as number) > max.count
          ? { templateId, count: count as number }
          : max,
      { templateId: '', count: 0 },
    );

    return mostUsed.count > 0 ? mostUsed : null;
  }

  private getReportsByFormat(reports: any[]): Record<string, number> {
    return reports.reduce(
      (acc, report) => {
        acc[report.format] = (acc[report.format] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private getReportsByCategory(
    reports: any[],
    templates: any[],
  ): Record<string, number> {
    const templateCategories = templates.reduce(
      (acc, template) => {
        acc[template.id] = template.category;
        return acc;
      },
      {} as Record<string, string>,
    );

    return reports.reduce(
      (acc, report) => {
        const category = templateCategories[report.templateId] || 'unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
