import {
  Controller,
  Post,
  Get,
  Body,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import {
  AiTrainerService,
  TrainingConfig,
  TrainingMetrics,
} from './ai-trainer.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('AI Training')
@Controller('ai/training')
export class AiTrainingController {
  private readonly logger = new Logger(AiTrainingController.name);

  constructor(private readonly aiTrainerService: AiTrainerService) {}

  @Post('train')
  @ApiOperation({ summary: 'Train the AI recommendation model' })
  @ApiBody({
    description: 'Training configuration (optional)',
    schema: {
      type: 'object',
      properties: {
        epochs: { type: 'number', default: 50 },
        batchSize: { type: 'number', default: 32 },
        learningRate: { type: 'number', default: 0.001 },
        validationSplit: { type: 'number', default: 0.2 },
        dropoutRate: { type: 'number', default: 0.3 },
        hiddenUnits: {
          type: 'array',
          items: { type: 'number' },
          default: [128, 64, 32],
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Training completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        metrics: {
          type: 'object',
          properties: {
            accuracy: { type: 'number' },
            loss: { type: 'number' },
            validationAccuracy: { type: 'number' },
            validationLoss: { type: 'number' },
            trainingTime: { type: 'number' },
            dataPoints: { type: 'number' },
            epochs: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Training failed',
  })
  async trainModel(@Body() config?: Partial<TrainingConfig>) {
    try {
      this.logger.log('🚀 Starting AI model training...');

      const metrics =
        await this.aiTrainerService.trainRecommendationModel(config);

      return {
        success: true,
        message: 'AI model training completed successfully!',
        metrics,
        recommendations: {
          nextSteps: [
            'The AI model is now ready to provide job recommendations',
            'Test the recommendations using the /recommendation endpoints',
            'Monitor model performance and retrain periodically with new data',
          ],
        },
      };
    } catch (error) {
      this.logger.error('❌ Training failed:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Training failed',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Get AI training status and model information' })
  @ApiResponse({
    status: 200,
    description: 'Training status retrieved successfully',
  })
  async getTrainingStatus() {
    try {
      const fs = require('fs');
      const path = require('path');

      const modelDir = path.join(__dirname, 'training', 'models');
      const metadataPath = path.join(modelDir, 'metadata.json');
      const modelPath = path.join(modelDir, 'recommendation-model');

      const modelExists = fs.existsSync(`${modelPath}/model.json`);
      const metadataExists = fs.existsSync(metadataPath);

      let metadata = null;
      if (metadataExists) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      }

      // Get recent training reports
      const dataDir = path.join(__dirname, 'training', 'data');
      let recentTraining = null;

      if (fs.existsSync(dataDir)) {
        const files = fs
          .readdirSync(dataDir)
          .filter((file: string) => file.startsWith('training_report_'))
          .sort()
          .reverse();

        if (files.length > 0) {
          const latestReport = path.join(dataDir, files[0]);
          recentTraining = JSON.parse(fs.readFileSync(latestReport, 'utf-8'));
        }
      }

      return {
        modelTrained: modelExists && metadataExists,
        modelPath: modelExists ? `${modelPath}/model.json` : null,
        metadata,
        recentTraining,
        status: modelExists ? 'ready' : 'not_trained',
        recommendations: modelExists
          ? ['Model is ready for generating recommendations']
          : [
              'Train the model first using POST /ai/training/train',
              'Ensure you have sufficient training data in your database',
              'Consider adding more job applications, user profiles, and interactions',
            ],
      };
    } catch (error) {
      this.logger.error('❌ Failed to get training status:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get training status',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('quick-train')
  @ApiOperation({
    summary: 'Quick train with default settings (for development)',
  })
  @ApiResponse({
    status: 200,
    description: 'Quick training completed',
  })
  async quickTrain() {
    try {
      this.logger.log('⚡ Starting quick training with default settings...');

      const quickConfig: Partial<TrainingConfig> = {
        epochs: 20,
        batchSize: 16,
        learningRate: 0.001,
        validationSplit: 0.2,
        dropoutRate: 0.2,
        hiddenUnits: [64, 32],
      };

      const metrics =
        await this.aiTrainerService.trainRecommendationModel(quickConfig);

      return {
        success: true,
        message:
          'Quick training completed! Model is ready for basic recommendations.',
        metrics,
        note: 'This is a quick training session. For production, use the full training endpoint with more epochs.',
      };
    } catch (error) {
      this.logger.error('❌ Quick training failed:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Quick training failed',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('data-stats')
  @ApiOperation({ summary: 'Get statistics about available training data' })
  @ApiResponse({
    status: 200,
    description: 'Training data statistics retrieved successfully',
  })
  async getDataStats() {
    try {
      // Get data statistics from the database
      const applications =
        await this.aiTrainerService['prisma'].jobApplication.count();
      const jobs = await this.aiTrainerService['prisma'].job.count();
      const users = await this.aiTrainerService['prisma'].user.count();
      const interviews =
        await this.aiTrainerService['prisma'].interview.count();

      // Get users with profiles
      const usersWithSkills = await this.aiTrainerService['prisma'].user.count({
        where: { skills: { some: {} } },
      });

      const usersWithExperience = await this.aiTrainerService[
        'prisma'
      ].user.count({
        where: { experiences: { some: {} } },
      });

      const usersWithEducation = await this.aiTrainerService[
        'prisma'
      ].user.count({
        where: { education: { some: {} } },
      });

      const dataQuality = this.assessDataQuality({
        applications,
        jobs,
        users,
        usersWithSkills,
        usersWithExperience,
        usersWithEducation,
        interviews,
      });

      return {
        totalData: {
          applications,
          jobs,
          users,
          interviews,
        },
        userProfiles: {
          total: users,
          withSkills: usersWithSkills,
          withExperience: usersWithExperience,
          withEducation: usersWithEducation,
          completionRate: {
            skills: ((usersWithSkills / Math.max(users, 1)) * 100).toFixed(1),
            experience: (
              (usersWithExperience / Math.max(users, 1)) *
              100
            ).toFixed(1),
            education: (
              (usersWithEducation / Math.max(users, 1)) *
              100
            ).toFixed(1),
          },
        },
        dataQuality,
        recommendations: this.getDataRecommendations(dataQuality),
      };
    } catch (error) {
      this.logger.error('❌ Failed to get data stats:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get data statistics',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private assessDataQuality(stats: any) {
    const { applications, jobs, users, usersWithSkills, usersWithExperience } =
      stats;

    let score = 0;
    const maxScore = 100;

    // Data volume (40 points)
    if (applications >= 100) score += 20;
    else if (applications >= 50) score += 15;
    else if (applications >= 10) score += 10;
    else if (applications >= 1) score += 5;

    if (jobs >= 50) score += 10;
    else if (jobs >= 20) score += 7;
    else if (jobs >= 5) score += 5;
    else if (jobs >= 1) score += 2;

    if (users >= 50) score += 10;
    else if (users >= 20) score += 7;
    else if (users >= 5) score += 5;
    else if (users >= 1) score += 2;

    // Profile completeness (60 points)
    const skillsRate = usersWithSkills / Math.max(users, 1);
    const experienceRate = usersWithExperience / Math.max(users, 1);

    score += skillsRate * 30;
    score += experienceRate * 30;

    const qualityLevel =
      score >= 80
        ? 'excellent'
        : score >= 60
          ? 'good'
          : score >= 40
            ? 'fair'
            : 'poor';

    return {
      score: Math.round(score),
      level: qualityLevel,
      sufficient: score >= 40,
    };
  }

  private getDataRecommendations(dataQuality: any): string[] {
    const recommendations: string[] = [];

    if (dataQuality.score < 40) {
      recommendations.push(
        '⚠️ Insufficient data for reliable training. Consider adding more users, jobs, and applications.',
      );
    }

    if (dataQuality.score < 60) {
      recommendations.push(
        '📊 Add more user profile data (skills, experience, education).',
      );
      recommendations.push('💼 Increase job diversity and applications.');
    }

    if (dataQuality.level === 'excellent') {
      recommendations.push(
        '✅ Data quality is excellent! Perfect for training.',
      );
    } else {
      recommendations.push(
        '🎯 Focus on profile completion to improve recommendation accuracy.',
      );
    }

    recommendations.push(
      '🔄 Regularly retrain the model as new data becomes available.',
    );

    return recommendations;
  }
}
