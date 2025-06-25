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
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InternshipsService } from './internships.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  InternshipSearchDto,
  CreateInternshipDto,
  UpdateInternshipDto,
  CreateInternshipApplicationDto,
  UpdateApplicationStatusDto,
} from './dto/internship.dto';

@Controller('internships')
export class InternshipsController {
  constructor(private readonly internshipsService: InternshipsService) {}

  // Public endpoints (no authentication required)

  @Get('search')
  async searchInternships(
    @Query(ValidationPipe) searchDto: InternshipSearchDto,
    @Request() req,
  ) {
    const userId = req.user?.id || req.user?.userId;
    return this.internshipsService.searchInternships(searchDto, userId);
  }

  @Get('popular-companies')
  async getPopularCompanies(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.internshipsService.getPopularCompanies(limitNum);
  }

  @Get('types')
  async getInternshipTypes() {
    return this.internshipsService.getInternshipTypes();
  }

  @Get('locations')
  async getInternshipLocations() {
    return this.internshipsService.getInternshipLocations();
  }

  @Get(':id')
  async getInternshipById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    const userId = req.user?.id || req.user?.userId;
    return this.internshipsService.getInternshipById(id, userId);
  }

  // Protected endpoints (authentication required)

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/stats')
  async getInternshipStats(@Request() req) {
    return this.internshipsService.getInternshipStats(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('applications/my')
  async getUserApplications(@Request() req, @Query('status') status?: string) {
    return this.internshipsService.getUserApplications(req.user, status);
  }

  @UseGuards(JwtAuthGuard)
  @Get('saved/my')
  async getSavedInternships(@Request() req) {
    return this.internshipsService.getSavedInternships(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('applications')
  async applyToInternship(
    @Body(ValidationPipe) applicationDto: CreateInternshipApplicationDto,
    @Request() req,
  ) {
    return this.internshipsService.applyToInternship(applicationDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  async toggleSaveInternship(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    return this.internshipsService.toggleSaveInternship(id, req.user);
  }

  // Employer-only endpoints

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @Post()
  async createInternship(
    @Body(ValidationPipe) createDto: CreateInternshipDto,
    @Request() req,
  ) {
    return this.internshipsService.createInternship(createDto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @Put(':id')
  async updateInternship(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateDto: UpdateInternshipDto,
    @Request() req,
  ) {
    return this.internshipsService.updateInternship(id, updateDto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @Delete(':id')
  async deleteInternship(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    return this.internshipsService.deleteInternship(id, req.user);
  }

  // Admin endpoints for managing applications

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EMPLOYER')
  @Put('applications/:applicationId/status')
  async updateApplicationStatus(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body(ValidationPipe) updateDto: UpdateApplicationStatusDto,
    @Request() req,
  ) {
    // This would be implemented to allow employers to update application status
    // For now, we'll return a placeholder
    return {
      message: 'Application status update endpoint - to be implemented',
    };
  }

  // Analytics endpoints for employers

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @Get('analytics/my-internships')
  async getMyInternshipsAnalytics(@Request() req) {
    // This would return analytics for employer's internships
    // For now, we'll return a placeholder
    return { message: 'Employer internships analytics - to be implemented' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @Get(':id/applications')
  async getInternshipApplications(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Query('status') status?: string,
  ) {
    // This would return applications for a specific internship
    // For now, we'll return a placeholder
    return { message: 'Internship applications endpoint - to be implemented' };
  }
}
