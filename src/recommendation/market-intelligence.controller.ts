import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { MarketIntelligenceService } from './market-intelligence.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@ApiTags('Market Intelligence')
@ApiBearerAuth()
@Controller('market-intelligence')
@UseGuards(JwtAuthGuard)
export class MarketIntelligenceController {
  constructor(private marketIntelligenceService: MarketIntelligenceService) {}

  @Get('skill-trends')
  @ApiOperation({
    summary: 'Get skill market trends',
    description: 'Analyze market demand and trends for specific skills',
  })
  @ApiQuery({
    name: 'skills',
    required: false,
    description: 'Comma-separated list of skills to analyze',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved skill trends',
  })
  async getSkillTrends(@Query('skills') skills?: string) {
    try {
      const skillsArray = skills ? skills.split(',').map((s) => s.trim()) : [];
      return await this.marketIntelligenceService.getSkillMarketTrends(
        skillsArray,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve skill trends',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('competitive-intelligence')
  @ApiOperation({
    summary: 'Get competitive intelligence',
    description: 'Analyze competitive landscape and benchmarking data',
  })
  @ApiQuery({
    name: 'field',
    required: false,
    description: 'Field for competitive analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved competitive intelligence',
  })
  async getCompetitiveIntelligence(
    @CurrentUser() user: any,
    @Query('field') field?: string,
  ) {
    try {
      return await this.marketIntelligenceService.getCompetitiveIntelligence(
        user.id,
        field || 'technology',
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve competitive intelligence',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('salary-intelligence')
  @ApiOperation({
    summary: 'Get salary intelligence',
    description: 'Comprehensive salary analysis and benchmarking',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Job role for salary analysis',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Location for salary analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved salary intelligence',
  })
  async getSalaryIntelligence(
    @Query('role') role?: string,
    @Query('location') location?: string,
  ) {
    try {
      return await this.marketIntelligenceService.getSalaryIntelligence(
        role || 'Software Engineer',
        location || 'United States',
        'mid',
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve salary intelligence',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('industry-forecast')
  @ApiOperation({
    summary: 'Get industry forecasting',
    description:
      'Analyze industry trends, growth projections, and future outlook',
  })
  @ApiQuery({
    name: 'industries',
    required: false,
    description: 'Comma-separated list of industries',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved industry forecast',
  })
  async getIndustryForecast(@Query('industries') industries?: string) {
    try {
      const industryList = industries
        ? industries.split(',').map((i) => i.trim())
        : [];
      return await this.marketIntelligenceService.getIndustryForecast(
        industryList,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve industry forecast',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('real-time-data')
  @ApiOperation({
    summary: 'Get real-time market data',
    description: 'Retrieve current market conditions and live data',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved real-time market data',
  })
  async getRealTimeMarketData() {
    try {
      return await this.marketIntelligenceService.getRealTimeMarketData();
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve real-time market data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
