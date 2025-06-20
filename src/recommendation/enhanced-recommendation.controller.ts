import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EnhancedRecommendationService } from './enhanced-recommendation.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

class EnhancedFiltersDto {
  location?: string;
  jobType?: string[];
  experience?: string[];
  salary?: { min?: number; max?: number };
  skills?: string[];
  company?: string[];
  industry?: string[];
  remoteOnly?: boolean;
  deadline?: Date;
  companySize?: string[];
  benefits?: string[];
  workSchedule?: string[];
}

class UserPreferencesDto {
  careerGoals?: string[];
  workEnvironment?: 'remote' | 'onsite' | 'hybrid' | 'any';
  companyCulture?: string[];
  learningOpportunities?: boolean;
  workLifeBalance?: number; // 1-10 scale
  salaryImportance?: number; // 1-10 scale
  growthPotential?: number; // 1-10 scale
  industryPreferences?: string[];
  roleTypes?: string[];
  avoidCompanies?: string[];
  preferredBenefits?: string[];
}

@ApiTags('Enhanced AI Recommendations')
@ApiBearerAuth()
@Controller('recommendations/enhanced')
@UseGuards(JwtAuthGuard)
export class EnhancedRecommendationController {
  constructor(
    private enhancedRecommendationService: EnhancedRecommendationService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get advanced AI-powered job recommendations',
    description:
      'Retrieve sophisticated job recommendations with detailed insights and analytics',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of recommendations to return (default: 20)',
  })
  @ApiQuery({
    name: 'includeAnalytics',
    required: false,
    description: 'Include recommendation insights (default: true)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved enhanced recommendations',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getAdvancedRecommendations(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('includeAnalytics') includeAnalytics?: string,
    @Query() filters?: EnhancedFiltersDto,
    @Query() preferences?: UserPreferencesDto,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 20;
      const analytics = includeAnalytics !== 'false';

      return await this.enhancedRecommendationService.generateAdvancedRecommendations(
        user.id,
        limitNum,
        filters,
        preferences,
        analytics,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve advanced recommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('learning')
  @ApiOperation({
    summary: 'Get learning recommendations',
    description:
      'Retrieve skill gaps, course recommendations, and certification suggestions',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved learning recommendations',
  })
  async getLearningRecommendations(@CurrentUser() user: any) {
    try {
      return await this.enhancedRecommendationService.getLearningRecommendations(
        user.id,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve learning recommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('career-path')
  @ApiOperation({
    summary: 'Get career path analysis',
    description: 'Analyze career progression opportunities and next steps',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved career path analysis',
  })
  async getCareerPathAnalysis(@CurrentUser() user: any) {
    try {
      return await this.enhancedRecommendationService.getCareerPathAnalysis(
        user.id,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve career path analysis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('market-intelligence')
  @ApiOperation({
    summary: 'Get market intelligence',
    description: 'Retrieve market demand, salary trends, and industry insights',
  })
  @ApiQuery({
    name: 'skills',
    required: false,
    description: 'Comma-separated list of skills to analyze',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Location for market analysis',
  })
  @ApiQuery({
    name: 'industry',
    required: false,
    description: 'Industry for market analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved market intelligence',
  })
  async getMarketIntelligence(
    @Query('skills') skills?: string,
    @Query('location') location?: string,
    @Query('industry') industry?: string,
  ) {
    try {
      const skillsArray = skills
        ? skills.split(',').map((s) => s.trim())
        : undefined;

      return await this.enhancedRecommendationService.getMarketIntelligence(
        skillsArray,
        location,
        industry,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve market intelligence',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get comprehensive career dashboard',
    description: 'Retrieve all AI insights in one comprehensive dashboard view',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved career dashboard',
  })
  async getCareerDashboard(@CurrentUser() user: any) {
    try {
      const [
        recommendations,
        learningRecommendations,
        careerPathAnalysis,
        marketIntelligence,
      ] = await Promise.all([
        this.enhancedRecommendationService.generateAdvancedRecommendations(
          user.id,
          10,
          undefined,
          undefined,
          true,
        ),
        this.enhancedRecommendationService.getLearningRecommendations(user.id),
        this.enhancedRecommendationService.getCareerPathAnalysis(user.id),
        this.enhancedRecommendationService.getMarketIntelligence(),
      ]);

      return {
        recommendations,
        learningRecommendations,
        careerPathAnalysis,
        marketIntelligence,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve career dashboard',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
