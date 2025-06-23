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
} from '@nestjs/common';
import { UniversityPartnersService } from './university-partners.service';
import { CreateUniversityPartnershipDto } from './dto/create-partnership.dto';
import { UpdateUniversityPartnershipDto } from './dto/update-partnership.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('University Partners')
@ApiBearerAuth()
@Controller('university-partners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EMPLOYER')
export class UniversityPartnersController {
  constructor(
    private readonly universityPartnersService: UniversityPartnersService,
  ) {}

  @Get('universities')
  async getUniversities(@Query() query: any) {
    const search = query.search;
    return this.universityPartnersService.searchUniversities(query);
  }

  @Get('universities/:id')
  async getUniversityById(@Param('id') id: string) {
    return this.universityPartnersService.getUniversityById(id);
  }

  @Post('partnerships')
  @Roles('EMPLOYER')
  async createPartnership(
    @CurrentUser() user: any,
    @Body() createPartnershipDto: CreateUniversityPartnershipDto,
  ) {
    return this.universityPartnersService.createPartnership(
      user.id,
      createPartnershipDto,
    );
  }

  @Get('partnerships/company/:companyId/analytics')
  @Roles('EMPLOYER')
  async getPartnershipAnalytics(
    @CurrentUser() user: any,
    @Param('companyId') companyId: string,
  ) {
    return this.universityPartnersService.getPartnershipAnalytics(
      user.id,
      companyId,
    );
  }

  @Get('partnerships/company/:companyId')
  @Roles('EMPLOYER')
  async getCompanyPartnerships(
    @CurrentUser() user: any,
    @Param('companyId') companyId: string,
    @Query() filters: any,
  ) {
    return this.universityPartnersService.getCompanyPartnerships(
      user.id,
      companyId,
      filters,
    );
  }

  @Get('partnerships/:id')
  async getPartnershipById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.universityPartnersService.getPartnershipById(id, userId);
  }

  @Put('partnerships/:id')
  async updatePartnership(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() data: UpdateUniversityPartnershipDto,
  ) {
    return this.universityPartnersService.updatePartnership(id, userId, data);
  }

  @Delete('partnerships/:id')
  async deletePartnership(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.universityPartnersService.deletePartnership(id, userId);
  }

  // Analytics and Recommendations
  @Get('partnerships/company/:companyId/recommendations')
  @Roles('EMPLOYER')
  async getUniversityRecommendations(
    @CurrentUser() user: any,
    @Param('companyId') companyId: string,
  ) {
    return this.universityPartnersService.getUniversityRecommendations(
      user.id,
      companyId,
    );
  }
}
