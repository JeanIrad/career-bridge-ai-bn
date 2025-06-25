import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, ApplicationStatus } from '@prisma/client';

@ApiTags('Applications')
@Controller('applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get('my-applications')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ALUMNI)
  @ApiOperation({ summary: 'Get my job applications' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by application status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search applications by job title or company',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Applications retrieved successfully',
  })
  async getMyApplications(@CurrentUser() user: any, @Query() query: any) {
    try {
      const result = await this.applicationsService.getMyApplications(
        user.id,
        query,
      );
      return {
        success: true,
        message: 'Applications retrieved successfully',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve applications',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ALUMNI)
  @ApiOperation({ summary: 'Get application statistics' })
  @ApiResponse({
    status: 200,
    description: 'Application statistics retrieved successfully',
  })
  async getApplicationStats(@CurrentUser() user: any) {
    try {
      const stats = await this.applicationsService.getApplicationStats(user.id);
      return {
        success: true,
        message: 'Application statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve application statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('upcoming-interviews')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ALUMNI)
  @ApiOperation({ summary: 'Get upcoming interviews' })
  @ApiResponse({
    status: 200,
    description: 'Upcoming interviews retrieved successfully',
  })
  async getUpcomingInterviews(@CurrentUser() user: any) {
    try {
      const interviews = await this.applicationsService.getUpcomingInterviews(
        user.id,
      );
      return {
        success: true,
        message: 'Upcoming interviews retrieved successfully',
        data: interviews,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve upcoming interviews',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ALUMNI)
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application retrieved successfully',
  })
  async getApplicationById(@Param('id') id: string, @CurrentUser() user: any) {
    try {
      const application = await this.applicationsService.getApplicationById(
        id,
        user.id,
      );
      return {
        success: true,
        message: 'Application retrieved successfully',
        data: application,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve application',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/timeline')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ALUMNI)
  @ApiOperation({ summary: 'Get application timeline' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application timeline retrieved successfully',
  })
  async getApplicationTimeline(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      const timeline = await this.applicationsService.getApplicationTimeline(
        id,
        user.id,
      );
      return {
        success: true,
        message: 'Application timeline retrieved successfully',
        data: timeline,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve application timeline',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/withdraw')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ALUMNI)
  @ApiOperation({ summary: 'Withdraw application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application withdrawn successfully',
  })
  async withdrawApplication(@Param('id') id: string, @CurrentUser() user: any) {
    try {
      const application = await this.applicationsService.withdrawApplication(
        id,
        user.id,
      );
      return {
        success: true,
        message: 'Application withdrawn successfully',
        data: application,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to withdraw application',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
