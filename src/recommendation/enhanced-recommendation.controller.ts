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
import {
  EnhancedFiltersDto,
  UserPreferencesDto,
  RecommendationQueryDto,
  MarketIntelligenceQueryDto,
  CombinedRecommendationQueryDto,
} from './dto/recommendation.dto';

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
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved enhanced recommendations',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getAdvancedRecommendations(
    @CurrentUser() user: any,
    @Query() queryDto: CombinedRecommendationQueryDto,
  ) {
    try {
      const { limit = 20, includeAnalytics = true, ...rest } = queryDto;

      // Separate filters and preferences from the combined DTO
      const filters = {
        location: rest.location,
        jobType: rest.jobType,
        experience: rest.experience,
        salary: rest.salary,
        skills: rest.skills,
        company: rest.company,
        industry: rest.industry,
        remoteOnly: rest.remoteOnly,
        deadline: rest.deadline,
        companySize: rest.companySize,
        benefits: rest.benefits,
        workSchedule: rest.workSchedule,
      };

      const preferences = {
        careerGoals: rest.careerGoals,
        workEnvironment: rest.workEnvironment,
        companyCulture: rest.companyCulture,
        learningOpportunities: rest.learningOpportunities,
        workLifeBalance: rest.workLifeBalance,
        salaryImportance: rest.salaryImportance,
        growthPotential: rest.growthPotential,
        industryPreferences: rest.industryPreferences,
        roleTypes: rest.roleTypes,
        avoidCompanies: rest.avoidCompanies,
        preferredBenefits: rest.preferredBenefits,
      };

      // Filter out undefined values from filters and preferences
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined),
      );

      const cleanPreferences = Object.fromEntries(
        Object.entries(preferences).filter(([_, value]) => value !== undefined),
      );

      return await this.enhancedRecommendationService.generateAdvancedRecommendations(
        user.id,
        limit,
        cleanFilters,
        cleanPreferences,
        includeAnalytics,
      );
    } catch (error) {
      console.error('Error in getAdvancedRecommendations:', error);
      throw new HttpException(
        error.message || 'Failed to retrieve advanced recommendations',
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
      console.error('Error in getLearningRecommendations:', error);
      throw new HttpException(
        error.message || 'Failed to retrieve learning recommendations',
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
      console.error('Error in getCareerPathAnalysis:', error);
      throw new HttpException(
        error.message || 'Failed to retrieve career path analysis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('market-intelligence')
  @ApiOperation({
    summary: 'Get market intelligence',
    description: 'Retrieve market demand, salary trends, and industry insights',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved market intelligence',
  })
  async getMarketIntelligence(@Query() queryDto: MarketIntelligenceQueryDto) {
    try {
      const { skills, location, industry } = queryDto;
      const skillsArray = skills
        ? skills.split(',').map((s) => s.trim())
        : undefined;

      return await this.enhancedRecommendationService.getMarketIntelligence(
        skillsArray,
        location,
        industry,
      );
    } catch (error) {
      console.error('Error in getMarketIntelligence:', error);
      throw new HttpException(
        error.message || 'Failed to retrieve market intelligence',
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
          {},
          {},
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
      console.error('Error in getCareerDashboard:', error);
      throw new HttpException(
        error.message || 'Failed to retrieve career dashboard',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
