import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EmployerDataGuard } from '../auth/guards/employer-data.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { EmployerAnalyticsService } from './employer-analytics.service';

@ApiTags('Employer Analytics')
@Controller('employer-analytics')
@UseGuards(JwtAuthGuard, RolesGuard, EmployerDataGuard)
@Roles(UserRole.EMPLOYER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class EmployerAnalyticsController {
  constructor(
    private readonly employerAnalyticsService: EmployerAnalyticsService,
  ) {}

  @Get('dashboard-overview')
  @ApiOperation({
    summary: 'Get employer dashboard overview statistics',
    description:
      'Accessible by: EMPLOYER (own data), ADMIN, SUPER_ADMIN (any data)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview data retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied: Insufficient permissions',
  })
  async getDashboardOverview(@Request() req) {
    return this.employerAnalyticsService.getDashboardOverview(req.user.id);
  }

  @Get('application-trends')
  @ApiOperation({ summary: 'Get application trends over time' })
  @ApiResponse({
    status: 200,
    description: 'Application trends data retrieved successfully',
  })
  async getApplicationTrends(
    @Request() req,
    @Query('period') period: string = '30d',
  ) {
    return this.employerAnalyticsService.getApplicationTrends(
      req.user.id,
      period,
    );
  }

  @Get('candidate-sources')
  @ApiOperation({ summary: 'Get candidate sources distribution' })
  @ApiResponse({
    status: 200,
    description: 'Candidate sources data retrieved successfully',
  })
  async getCandidateSources(@Request() req) {
    return this.employerAnalyticsService.getCandidateSources(req.user.id);
  }

  @Get('hiring-funnel')
  @ApiOperation({ summary: 'Get hiring funnel metrics' })
  @ApiResponse({
    status: 200,
    description: 'Hiring funnel data retrieved successfully',
  })
  async getHiringFunnel(@Request() req) {
    return this.employerAnalyticsService.getHiringFunnel(req.user.id);
  }

  @Get('skills-demand')
  @ApiOperation({ summary: 'Get most in-demand skills' })
  @ApiResponse({
    status: 200,
    description: 'Skills demand data retrieved successfully',
  })
  async getSkillsDemand(@Request() req) {
    return this.employerAnalyticsService.getSkillsDemand(req.user.id);
  }

  @Get('university-rankings')
  @ApiOperation({ summary: 'Get top universities by applications' })
  @ApiResponse({
    status: 200,
    description: 'University rankings data retrieved successfully',
  })
  async getUniversityRankings(@Request() req) {
    return this.employerAnalyticsService.getUniversityRankings(req.user.id);
  }

  @Get('performance-metrics')
  @ApiOperation({ summary: 'Get performance metrics comparison' })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics data retrieved successfully',
  })
  async getPerformanceMetrics(
    @Request() req,
    @Query('period') period: string = '30d',
  ) {
    return this.employerAnalyticsService.getPerformanceMetrics(
      req.user.id,
      period,
    );
  }

  @Get('recent-activities')
  @ApiOperation({ summary: 'Get recent activities and notifications' })
  @ApiResponse({
    status: 200,
    description: 'Recent activities data retrieved successfully',
  })
  async getRecentActivities(@Request() req) {
    return this.employerAnalyticsService.getRecentActivities(req.user.id);
  }
}
