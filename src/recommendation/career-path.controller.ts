import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { CareerPathService } from './career-path.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@ApiTags('Career Path Analysis')
@ApiBearerAuth()
@Controller('career-path')
@UseGuards(JwtAuthGuard)
export class CareerPathController {
  constructor(private careerPathService: CareerPathService) {}

  @Get('analysis')
  @ApiOperation({
    summary: 'Get comprehensive career analysis',
    description:
      'Analyze current career position and provide trajectory predictions',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved career analysis',
  })
  async getCareerAnalysis(@CurrentUser() user: any) {
    try {
      return await this.careerPathService.generateCareerAnalysis(user.id);
    } catch (error) {
      throw new HttpException(
        'Failed to generate career analysis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('transitions')
  @ApiOperation({
    summary: 'Analyze career transition opportunities',
    description: 'Identify potential career transitions and their requirements',
  })
  @ApiQuery({
    name: 'targetRoles',
    required: false,
    description: 'Comma-separated list of target roles',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully analyzed transition opportunities',
  })
  async analyzeCareerTransitions(
    @CurrentUser() user: any,
    @Query('targetRoles') targetRoles?: string,
  ) {
    try {
      const roles = targetRoles
        ? targetRoles.split(',').map((r) => r.trim())
        : [];
      return await this.careerPathService.analyzeCareerTransitions(
        user.id,
        roles,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to analyze career transitions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('salary-forecast')
  @ApiOperation({
    summary: 'Get salary progression forecast',
    description: 'Predict salary growth based on career path and market trends',
  })
  @ApiQuery({
    name: 'targetPath',
    required: false,
    description: 'Target career path for analysis',
  })
  @ApiQuery({
    name: 'timeframe',
    required: false,
    description: 'Forecast timeframe in years (default: 5)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated salary forecast',
  })
  async getSalaryForecast(
    @CurrentUser() user: any,
    @Query('targetPath') targetPath?: string,
    @Query('timeframe') timeframe?: string,
  ) {
    try {
      const years = timeframe ? parseInt(timeframe, 10) : 5;
      const path = targetPath || 'current';
      return await this.careerPathService.predictSalaryProgression(
        user.id,
        path,
        years,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to generate salary forecast',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('industry-insights')
  @ApiOperation({
    summary: 'Get industry insights and trends',
    description:
      'Analyze industry trends, growth projections, and opportunities',
  })
  @ApiQuery({
    name: 'industries',
    required: false,
    description: 'Comma-separated list of industries',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved industry insights',
  })
  async getIndustryInsights(@Query('industries') industries?: string) {
    try {
      const industryList = industries
        ? industries.split(',').map((i) => i.trim())
        : [];
      return await this.careerPathService.getIndustryInsights(industryList);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve industry insights',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('paths/:role')
  @ApiOperation({
    summary: 'Get career paths for specific role',
    description: 'Retrieve possible career paths starting from a specific role',
  })
  @ApiParam({
    name: 'role',
    description: 'Job role to analyze career paths for',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved career paths',
  })
  async getCareerPathsForRole(@Param('role') role: string) {
    try {
      return await this.careerPathService.getCareerPathsForRole(role);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve career paths',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
