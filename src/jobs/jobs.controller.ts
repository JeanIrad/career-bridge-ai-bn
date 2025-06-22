import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Patch,
  Req,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateJobDto,
  UpdateJobDto,
  JobQueryDto,
  JobStatsDto,
} from './dto/job.dto';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // ============= EMPLOYER ENDPOINTS =============

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Employer role required',
  })
  async createJob(
    @CurrentUser() user: any,
    @Body() createJobDto: CreateJobDto,
  ) {
    try {
      const job = await this.jobsService.createJob(user.id, createJobDto);
      return {
        success: true,
        message: 'Job created successfully',
        data: job,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create job',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('my-jobs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all jobs posted by current employer' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by job status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title and description',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async getMyJobs(@CurrentUser() user: any, @Query() query: JobQueryDto) {
    try {
      const result = await this.jobsService.getEmployerJobs(user.id, query);
      return {
        success: true,
        message: 'Jobs retrieved successfully',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve jobs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my-jobs/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get statistics for employer jobs' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period for stats (e.g., 30d, 7d)',
  })
  @ApiResponse({
    status: 200,
    description: 'Job statistics retrieved successfully',
  })
  async getMyJobStats(
    @CurrentUser() user: any,
    @Query('period') period?: string,
  ) {
    try {
      const stats = await this.jobsService.getEmployerJobStats(user.id, period);
      return {
        success: true,
        message: 'Job statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve job statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my-jobs/all-applications')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all applications across all employer jobs' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by application status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search candidates by name, email, university, etc.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'All applications retrieved successfully',
  })
  async getAllEmployerApplications(
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    try {
      const result = await this.jobsService.getAllEmployerApplications(
        user.id,
        query,
      );
      return {
        success: true,
        message: 'All applications retrieved successfully',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve applications',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific job by ID' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobById(@Param('id') id: string, @CurrentUser() user: any) {
    try {
      const job = await this.jobsService.getJobById(id, user.id);
      return {
        success: true,
        message: 'Job retrieved successfully',
        data: job,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Job not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update job posting' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job updated successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to update this job',
  })
  async updateJob(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    try {
      const job = await this.jobsService.updateJob(id, user.id, updateJobDto);
      return {
        success: true,
        message: 'Job updated successfully',
        data: job,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update job',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update job status (ACTIVE/CLOSED)' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job status updated successfully' })
  async updateJobStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { status: 'ACTIVE' | 'CLOSED' },
  ) {
    try {
      const job = await this.jobsService.updateJobStatus(
        id,
        user.id,
        body.status,
      );
      return {
        success: true,
        message: 'Job status updated successfully',
        data: job,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update job status',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete job posting' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job deleted successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async deleteJob(@Param('id') id: string, @CurrentUser() user: any) {
    try {
      await this.jobsService.deleteJob(id, user.id);
      return {
        success: true,
        message: 'Job deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete job',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ============= PUBLIC ENDPOINTS =============

  @Get()
  @ApiOperation({ summary: 'Get all active job postings (public)' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title and description',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filter by location',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by job type',
  })
  @ApiQuery({
    name: 'company',
    required: false,
    description: 'Filter by company',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async getAllJobs(@Query() query: JobQueryDto, @CurrentUser() user?: any) {
    try {
      const result = await this.jobsService.getAllJobs(query, user?.id);
      return {
        success: true,
        message: 'Jobs retrieved successfully',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve jobs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/applications')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get applications for a specific job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by application status',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Applications retrieved successfully',
  })
  async getJobApplications(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    try {
      const result = await this.jobsService.getJobApplications(
        id,
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

  @Post(':id/apply')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ALUMNI)
  @ApiOperation({ summary: 'Apply to a job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({
    status: 201,
    description: 'Application submitted successfully',
  })
  async applyToJob(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() applicationData: { resumeUrl: string; coverLetter?: string },
  ) {
    try {
      const application = await this.jobsService.applyToJob(
        id,
        user.id,
        applicationData,
      );
      return {
        success: true,
        message: 'Application submitted successfully',
        data: application,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to submit application',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get detailed statistics for a specific job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({
    status: 200,
    description: 'Job statistics retrieved successfully',
  })
  async getJobStats(@Param('id') id: string, @CurrentUser() user: any) {
    try {
      const stats = await this.jobsService.getJobStats(id, user.id);
      return {
        success: true,
        message: 'Job statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve job statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/applications/:applicationId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @ApiOperation({ summary: 'Update application status' })
  @ApiResponse({
    status: 200,
    description: 'Application status updated successfully',
  })
  async updateApplicationStatus(
    @Param('id') jobId: string,
    @Param('applicationId') applicationId: string,
    @Body() updateData: { status: string; message?: string },
    @Req() req: any,
  ) {
    return this.jobsService.updateApplicationStatus(
      jobId,
      applicationId,
      updateData.status,
      req.user.id,
      updateData.message,
    );
  }

  @Post(':id/applications/:applicationId/shortlist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @ApiOperation({ summary: 'Shortlist a candidate' })
  @ApiResponse({
    status: 200,
    description: 'Candidate shortlisted successfully',
  })
  async shortlistCandidate(
    @Param('id') jobId: string,
    @Param('applicationId') applicationId: string,
    @Body() data: { message?: string },
    @Req() req: any,
  ) {
    return this.jobsService.shortlistCandidate(
      jobId,
      applicationId,
      req.user.id,
      data.message,
    );
  }

  @Post(':id/applications/:applicationId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @ApiOperation({ summary: 'Reject a candidate application' })
  @ApiResponse({
    status: 200,
    description: 'Application rejected successfully',
  })
  async rejectApplication(
    @Param('id') jobId: string,
    @Param('applicationId') applicationId: string,
    @Body() data: { reason?: string },
    @Req() req: any,
  ) {
    return this.jobsService.rejectApplication(
      jobId,
      applicationId,
      req.user.id,
      data.reason,
    );
  }

  @Post(':id/applications/:applicationId/schedule-interview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @ApiOperation({ summary: 'Schedule interview with candidate' })
  @ApiResponse({ status: 200, description: 'Interview scheduled successfully' })
  async scheduleInterview(
    @Param('id') jobId: string,
    @Param('applicationId') applicationId: string,
    @Body()
    data: {
      scheduledDate: string;
      scheduledTime: string;
      interviewType: 'PHONE' | 'VIDEO' | 'IN_PERSON';
      location?: string;
      meetingLink?: string;
      notes?: string;
    },
    @Req() req: any,
  ) {
    return this.jobsService.scheduleInterview(
      jobId,
      applicationId,
      req.user.id,
      data,
    );
  }

  @Post(':id/applications/:applicationId/message')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @ApiOperation({ summary: 'Send message to candidate' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  async messageCandidate(
    @Param('id') jobId: string,
    @Param('applicationId') applicationId: string,
    @Body() data: { subject: string; message: string },
    @Req() req: any,
  ) {
    return this.jobsService.messageCandidate(
      jobId,
      applicationId,
      req.user.id,
      data.subject,
      data.message,
    );
  }
}
