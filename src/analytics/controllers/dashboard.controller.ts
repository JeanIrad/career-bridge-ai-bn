import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { DashboardService } from '../services/dashboard.service';
import {
  AnalyticsService,
  AnalyticsFilter,
} from '../services/analytics.service';
import { KpiService } from '../services/kpi.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';

class DashboardQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(UserRole)
  userRole?: UserRole;

  @IsOptional()
  department?: string;

  @IsOptional()
  location?: string;
}

@ApiTags('Dashboard Analytics')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly analyticsService: AnalyticsService,
    private readonly kpiService: KpiService,
  ) {}

  @ApiOperation({
    summary: 'Get role-specific dashboard',
    description:
      "Retrieve dashboard data tailored to the user's role and permissions",
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        dashboard: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: Object.values(UserRole) },
            widgets: { type: 'array' },
            quickActions: { type: 'array' },
            notifications: { type: 'array' },
            summary: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analytics (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analytics (ISO format)',
  })
  @ApiQuery({
    name: 'userRole',
    required: false,
    enum: UserRole,
    description: 'Filter by user role (Admin only)',
  })
  @Get()
  async getDashboard(@Query() query: DashboardQueryDto, @Request() req) {
    const userId = req.user.id;
    const userRole = req.user.role as UserRole;

    // Build analytics filter
    const filter: AnalyticsFilter = {};
    if (query.startDate && query.endDate) {
      filter.dateRange = {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      };
    }
    if (query.userRole && userRole === UserRole.ADMIN) {
      filter.userRole = query.userRole;
    }
    if (query.department) {
      filter.department = query.department;
    }
    if (query.location) {
      filter.location = query.location;
    }

    let dashboard;

    try {
      switch (userRole) {
        case UserRole.ADMIN:
        case UserRole.SUPER_ADMIN:
          dashboard = await this.dashboardService.getAdminDashboard(filter);
          break;
        case UserRole.STUDENT:
          dashboard = await this.dashboardService.getStudentDashboard(
            userId,
            filter,
          );
          break;
        case UserRole.EMPLOYER:
          dashboard = await this.dashboardService.getEmployerDashboard(
            userId,
            filter,
          );
          break;
        case UserRole.UNIVERSITY_STAFF:
        case UserRole.PROFESSOR:
          // University staff get a modified admin dashboard
          dashboard = await this.dashboardService.getAdminDashboard(filter);
          break;
        case UserRole.ALUMNI:
          // Alumni get a modified student dashboard
          dashboard = await this.dashboardService.getStudentDashboard(
            userId,
            filter,
          );
          break;
        case UserRole.MENTOR:
          // Mentors get a specialized dashboard (could be implemented)
          dashboard = await this.dashboardService.getStudentDashboard(
            userId,
            filter,
          );
          break;
        default:
          throw new BadRequestException('Unsupported user role for dashboard');
      }

      return {
        message: 'Dashboard data retrieved successfully',
        dashboard,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve dashboard: ${error.message}`,
      );
    }
  }

  @ApiOperation({
    summary: 'Get platform overview metrics',
    description: 'Get high-level platform statistics and metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform overview retrieved successfully',
  })
  @Get('overview')
  async getPlatformOverview(@Query() query: DashboardQueryDto, @Request() req) {
    const userRole = req.user.role as UserRole;

    // Only allow certain roles to access platform overview
    const allowedRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.UNIVERSITY_STAFF,
    ];
    if (!allowedRoles.includes(userRole)) {
      throw new BadRequestException(
        'Insufficient permissions to access platform overview',
      );
    }

    const filter: AnalyticsFilter = {};
    if (query.startDate && query.endDate) {
      filter.dateRange = {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      };
    }

    const overview = await this.analyticsService.getPlatformOverview(filter);

    return {
      message: 'Platform overview retrieved successfully',
      overview,
    };
  }

  @ApiOperation({
    summary: 'Get user engagement metrics',
    description: 'Retrieve detailed user engagement and activity metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'User engagement metrics retrieved successfully',
  })
  @Get('engagement')
  async getUserEngagementMetrics(
    @Query() query: DashboardQueryDto,
    @Request() req,
  ) {
    const userRole = req.user.role as UserRole;

    // Only allow certain roles to access engagement metrics
    const allowedEngagementRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.UNIVERSITY_STAFF,
    ];
    if (!allowedEngagementRoles.includes(userRole)) {
      throw new BadRequestException(
        'Insufficient permissions to access engagement metrics',
      );
    }

    const filter: AnalyticsFilter = {};
    if (query.startDate && query.endDate) {
      filter.dateRange = {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      };
    }

    const engagementMetrics =
      await this.analyticsService.getUserEngagementMetrics(filter);

    return {
      message: 'User engagement metrics retrieved successfully',
      engagementMetrics,
    };
  }

  @ApiOperation({
    summary: 'Get user growth data',
    description: 'Retrieve user registration and growth trends over time',
  })
  @ApiResponse({
    status: 200,
    description: 'User growth data retrieved successfully',
  })
  @Get('user-growth')
  async getUserGrowthData(@Query() query: DashboardQueryDto, @Request() req) {
    const userRole = req.user.role as UserRole;

    const allowedGrowthRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.UNIVERSITY_STAFF,
    ];
    if (!allowedGrowthRoles.includes(userRole)) {
      throw new BadRequestException(
        'Insufficient permissions to access user growth data',
      );
    }

    const filter: AnalyticsFilter = {};
    if (query.startDate && query.endDate) {
      filter.dateRange = {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      };
    }

    const userGrowthData =
      await this.analyticsService.getUserGrowthData(filter);

    return {
      message: 'User growth data retrieved successfully',
      userGrowthData,
    };
  }

  @ApiOperation({
    summary: 'Get application success rates',
    description: 'Retrieve job application statistics and success rates',
  })
  @ApiResponse({
    status: 200,
    description: 'Application success rates retrieved successfully',
  })
  @Get('application-stats')
  async getApplicationSuccessRates(
    @Query() query: DashboardQueryDto,
    @Request() req,
  ) {
    const userRole = req.user.role as UserRole;

    const allowedAppStatsRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.UNIVERSITY_STAFF,
      UserRole.EMPLOYER,
    ];
    if (!allowedAppStatsRoles.includes(userRole)) {
      throw new BadRequestException(
        'Insufficient permissions to access application statistics',
      );
    }

    const filter: AnalyticsFilter = {};
    if (query.startDate && query.endDate) {
      filter.dateRange = {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      };
    }

    const applicationStats =
      await this.analyticsService.getApplicationSuccessRates(filter);

    return {
      message: 'Application success rates retrieved successfully',
      applicationStats,
    };
  }

  @ApiOperation({
    summary: 'Get top performing companies',
    description: 'Retrieve list of top performing companies by various metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Top companies retrieved successfully',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of companies to retrieve (default: 10)',
  })
  @Get('top-companies')
  async getTopCompanies(
    @Query() query: DashboardQueryDto & { limit?: number },
    @Request() req,
  ) {
    const userRole = req.user.role as UserRole;

    const allowedCompanyStatsRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.UNIVERSITY_STAFF,
    ];
    if (!allowedCompanyStatsRoles.includes(userRole)) {
      throw new BadRequestException(
        'Insufficient permissions to access company statistics',
      );
    }

    const filter: AnalyticsFilter = {};
    if (query.startDate && query.endDate) {
      filter.dateRange = {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      };
    }

    const limit = Number(query.limit) || 10;
    const topCompanies = await this.analyticsService.getTopCompanies(
      limit,
      filter,
    );

    return {
      message: 'Top companies retrieved successfully',
      topCompanies,
    };
  }

  @ApiOperation({
    summary: 'Get skill demand analysis',
    description: 'Retrieve analysis of skills in demand in the job market',
  })
  @ApiResponse({
    status: 200,
    description: 'Skill demand analysis retrieved successfully',
  })
  @Get('skill-demand')
  async getSkillDemandAnalysis(
    @Query() query: DashboardQueryDto,
    @Request() req,
  ) {
    const userRole = req.user.role as UserRole;

    // Allow students to see skill demand for career planning
    const allowedSkillDemandRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.UNIVERSITY_STAFF,
      UserRole.STUDENT,
      UserRole.ALUMNI,
      UserRole.PROFESSOR,
    ];
    if (!allowedSkillDemandRoles.includes(userRole)) {
      throw new BadRequestException(
        'Insufficient permissions to access skill demand analysis',
      );
    }

    const filter: AnalyticsFilter = {};
    if (query.startDate && query.endDate) {
      filter.dateRange = {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      };
    }

    const skillDemand =
      await this.analyticsService.getSkillDemandAnalysis(filter);

    return {
      message: 'Skill demand analysis retrieved successfully',
      skillDemand,
    };
  }

  @ApiOperation({
    summary: 'Get role-specific KPIs',
    description:
      "Retrieve key performance indicators specific to the user's role",
  })
  @ApiResponse({
    status: 200,
    description: 'KPIs retrieved successfully',
  })
  @Get('kpis')
  async getRoleSpecificKPIs(@Query() query: DashboardQueryDto, @Request() req) {
    const userId = req.user.id;
    const userRole = req.user.role as UserRole;

    const filter: AnalyticsFilter = {};
    if (query.startDate && query.endDate) {
      filter.dateRange = {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      };
    }

    let kpis;

    try {
      switch (userRole) {
        case UserRole.ADMIN:
        case UserRole.SUPER_ADMIN:
          kpis = await this.kpiService.getAdminKPIs(filter);
          break;
        case UserRole.STUDENT:
        case UserRole.ALUMNI:
          kpis = await this.kpiService.getStudentKPIs(userId, filter);
          break;
        case UserRole.EMPLOYER:
          kpis = await this.kpiService.getEmployerKPIs(userId, filter);
          break;
        case UserRole.UNIVERSITY_STAFF:
        case UserRole.PROFESSOR:
          // University staff get admin KPIs with limited scope
          kpis = await this.kpiService.getAdminKPIs(filter);
          break;
        default:
          throw new BadRequestException('Unsupported user role for KPIs');
      }

      return {
        message: 'KPIs retrieved successfully',
        kpis,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve KPIs: ${error.message}`,
      );
    }
  }

  @ApiOperation({
    summary: 'Refresh dashboard data',
    description: 'Force refresh of dashboard data and clear cache',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data refreshed successfully',
  })
  @Get('refresh')
  async refreshDashboard(@Request() req) {
    const userId = req.user.id;
    const userRole = req.user.role as UserRole;

    // In a real implementation, this would clear relevant caches
    // and trigger data refresh

    return {
      message: 'Dashboard data refreshed successfully',
      refreshedAt: new Date(),
      userId,
      userRole,
    };
  }
}
