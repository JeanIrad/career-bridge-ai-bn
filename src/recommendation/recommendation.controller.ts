import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

class RecommendationFiltersDto {
  location?: string;
  jobType?: string[];
  experience?: string[];
  salary?: { min?: number; max?: number };
  skills?: string[];
  company?: string[];
  industry?: string[];
  remoteOnly?: boolean;
  deadline?: Date;
}

class RecommendationPreferencesDto {
  prioritizeSkillMatch?: boolean;
  prioritizeLocation?: boolean;
  prioritizeSalary?: boolean;
  prioritizeCompanySize?: boolean;
  prioritizeIndustry?: boolean;
  careerGoals?: string[];
  workEnvironment?: 'remote' | 'onsite' | 'hybrid' | 'any';
  cultureFit?: string[];
}

class FeedbackDto {
  feedback: 'liked' | 'disliked' | 'applied' | 'saved' | 'rejected';
  reasons?: string[];
}

@ApiTags('Job Recommendations')
@ApiBearerAuth()
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(private recommendationService: RecommendationService) {}

  @Get()
  @ApiOperation({
    summary: 'Get personalized job recommendations',
    description:
      'Retrieve AI-powered job recommendations tailored to the user profile',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of recommendations to return (default: 10)',
  })
  @ApiQuery({
    name: 'refresh',
    required: false,
    description: 'Force refresh recommendations cache',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved recommendations',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getRecommendations(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('refresh') refresh?: string,
    @Query() filters?: RecommendationFiltersDto,
    @Query() preferences?: RecommendationPreferencesDto,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 10;
      const refreshBool = refresh === 'true';

      return await this.recommendationService.getJobRecommendationsForUser(
        user.id,
        limitNum,
        filters,
        preferences,
        refreshBool,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve recommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get recommendation analytics',
    description: 'Retrieve detailed analytics about user recommendations',
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved analytics' })
  async getRecommendationAnalytics(@CurrentUser() user: any) {
    try {
      return await this.recommendationService.getRecommendationAnalytics(
        user.id,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('similar/:jobId')
  @ApiOperation({
    summary: 'Get similar jobs',
    description: 'Find jobs similar to a specific job',
  })
  @ApiParam({ name: 'jobId', description: 'Job ID to find similar jobs for' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of similar jobs to return (default: 5)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved similar jobs',
  })
  async getSimilarJobs(
    @CurrentUser() user: any,
    @Param('jobId') jobId: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 5;
      return await this.recommendationService.getSimilarJobs(
        jobId,
        user.id,
        limitNum,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve similar jobs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('feedback/:jobId')
  @ApiOperation({
    summary: 'Provide feedback on recommendation',
    description: 'Submit feedback to improve future recommendations',
  })
  @ApiParam({ name: 'jobId', description: 'Job ID to provide feedback for' })
  @ApiBody({ type: FeedbackDto })
  @ApiResponse({ status: 200, description: 'Successfully submitted feedback' })
  async submitFeedback(
    @CurrentUser() user: any,
    @Param('jobId') jobId: string,
    @Body() feedbackDto: FeedbackDto,
  ) {
    try {
      await this.recommendationService.updateRecommendationFeedback(
        user.id,
        jobId,
        feedbackDto.feedback,
        feedbackDto.reasons,
      );
      return { message: 'Feedback submitted successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to submit feedback',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh user recommendations',
    description: 'Clear cache and regenerate recommendations',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully refreshed recommendations',
  })
  async refreshRecommendations(@CurrentUser() user: any) {
    try {
      await this.recommendationService.refreshUserRecommendations(user.id);
      return { message: 'Recommendations refreshed successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to refresh recommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
