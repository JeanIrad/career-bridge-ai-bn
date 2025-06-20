import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LearningRecommendationService } from './learning-recommendation.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@ApiTags('Learning Recommendations')
@ApiBearerAuth()
@Controller('recommendations/learning')
@UseGuards(JwtAuthGuard)
export class LearningRecommendationController {
  constructor(
    private learningRecommendationService: LearningRecommendationService,
  ) {}

  @Get('skill-gap-analysis')
  @ApiOperation({
    summary: 'Get skill gap analysis',
    description: 'Analyze skill gaps and provide learning recommendations',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved skill gap analysis',
  })
  async getSkillGapAnalysis(@CurrentUser() user: any) {
    try {
      return await this.learningRecommendationService.getSkillGapAnalysis(
        user.id,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve skill gap analysis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('resources')
  @ApiOperation({
    summary: 'Get learning resources',
    description: 'Retrieve recommended learning resources for specific skills',
  })
  @ApiQuery({
    name: 'skills',
    required: false,
    description: 'Comma-separated list of skills',
  })
  @ApiQuery({
    name: 'budget',
    required: false,
    description: 'Budget constraint',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved learning resources',
  })
  async getLearningResources(
    @CurrentUser() user: any,
    @Query('skills') skills?: string,
    @Query('budget') budget?: string,
  ) {
    try {
      const skillsArray = skills
        ? skills.split(',').map((s) => s.trim())
        : undefined;
      const budgetNum = budget ? parseFloat(budget) : undefined;

      return await this.learningRecommendationService.getLearningResources(
        skillsArray || [],
        'intermediate',
        budgetNum,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve learning resources',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
