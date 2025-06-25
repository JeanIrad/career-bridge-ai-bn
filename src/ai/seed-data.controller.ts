import {
  Controller,
  Post,
  Delete,
  Body,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SeedDataService, SeedConfig } from './seed-data.service';
import { AiTrainerService } from './ai-trainer.service';

@ApiTags('AI Seed Data')
@Controller('ai/seed')
export class SeedDataController {
  private readonly logger = new Logger(SeedDataController.name);

  constructor(
    private readonly seedDataService: SeedDataService,
    private readonly aiTrainerService: AiTrainerService,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate seed data for AI training' })
  @ApiResponse({
    status: 200,
    description: 'Seed data generated successfully',
  })
  @ApiBody({
    description: 'Seed generation configuration',
    schema: {
      type: 'object',
      properties: {
        users: { type: 'number', default: 100 },
        companies: { type: 'number', default: 20 },
        jobs: { type: 'number', default: 100 },
        applications: { type: 'number', default: 200 },
        savedJobs: { type: 'number', default: 150 },
        clearExisting: { type: 'boolean', default: false },
      },
    },
  })
  async generateSeedData(
    @Body() config?: SeedConfig & { clearExisting?: boolean },
  ) {
    try {
      this.logger.log('🌱 Starting seed data generation...');

      if (config?.clearExisting) {
        await this.seedDataService.clearSeedData();
      }

      const seedConfig: SeedConfig = {
        users: config?.users || 100,
        companies: config?.companies || 20,
        jobs: config?.jobs || 100,
        applications: config?.applications || 200,
        savedJobs: config?.savedJobs || 150,
      };

      await this.seedDataService.generateSeedData(seedConfig);

      return {
        success: true,
        message: 'Seed data generated successfully!',
        config: seedConfig,
        tip: 'You can now train the AI model with: POST /ai/training/train',
      };
    } catch (error) {
      this.logger.error('Error generating seed data:', error);
      throw new HttpException(
        'Failed to generate seed data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-and-train')
  @ApiOperation({
    summary: 'Generate seed data and immediately train AI model',
  })
  @ApiResponse({
    status: 200,
    description: 'Seed data generated and AI model trained successfully',
  })
  @ApiBody({
    description: 'Seed generation and training configuration',
    schema: {
      type: 'object',
      properties: {
        users: { type: 'number', default: 100 },
        companies: { type: 'number', default: 20 },
        jobs: { type: 'number', default: 100 },
        applications: { type: 'number', default: 200 },
        savedJobs: { type: 'number', default: 150 },
        clearExisting: { type: 'boolean', default: true },
        epochs: { type: 'number', default: 50 },
        batchSize: { type: 'number', default: 32 },
        learningRate: { type: 'number', default: 0.001 },
      },
    },
  })
  async generateAndTrain(
    @Body()
    config?: SeedConfig & {
      clearExisting?: boolean;
      epochs?: number;
      batchSize?: number;
      learningRate?: number;
    },
  ) {
    try {
      this.logger.log(
        '🚀 Starting seed generation and AI training pipeline...',
      );

      // Step 1: Generate seed data
      if (config?.clearExisting !== false) {
        await this.seedDataService.clearSeedData();
      }

      const seedConfig: SeedConfig = {
        users: config?.users || 100,
        companies: config?.companies || 20,
        jobs: config?.jobs || 100,
        applications: config?.applications || 200,
        savedJobs: config?.savedJobs || 150,
      };

      await this.seedDataService.generateSeedData(seedConfig);
      this.logger.log('✅ Seed data generation completed');

      // Step 2: Train AI model
      const trainingConfig = {
        epochs: config?.epochs || 50,
        batchSize: config?.batchSize || 32,
        learningRate: config?.learningRate || 0.001,
        validationSplit: 0.2,
        dropoutRate: 0.3,
        hiddenUnits: [128, 64, 32],
      };

      const metrics =
        await this.aiTrainerService.trainRecommendationModel(trainingConfig);
      this.logger.log('✅ AI model training completed');

      return {
        success: true,
        message: 'Seed data generated and AI model trained successfully!',
        seedConfig,
        trainingMetrics: metrics,
        summary: {
          dataPoints: metrics.dataPoints,
          trainingTime: `${(metrics.trainingTime / 1000).toFixed(2)}s`,
          finalAccuracy: `${(metrics.accuracy * 100).toFixed(2)}%`,
          finalLoss: metrics.loss.toFixed(4),
        },
        nextSteps: [
          'Test the AI recommendations using the /recommendation endpoints',
          'Monitor model performance in production',
          'Retrain periodically as more real data becomes available',
        ],
      };
    } catch (error) {
      this.logger.error('Error in generate and train pipeline:', error);
      throw new HttpException(
        'Failed to generate seed data and train model',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear all seed data' })
  @ApiResponse({
    status: 200,
    description: 'Seed data cleared successfully',
  })
  async clearSeedData() {
    try {
      await this.seedDataService.clearSeedData();

      return {
        success: true,
        message: 'All seed data has been cleared successfully',
        warning: 'This action cannot be undone',
      };
    } catch (error) {
      this.logger.error('Error clearing seed data:', error);
      throw new HttpException(
        'Failed to clear seed data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('quick-setup')
  @ApiOperation({
    summary:
      'Quick setup with recommended seed data and training (for development)',
  })
  @ApiResponse({
    status: 200,
    description: 'Quick setup completed successfully',
  })
  async quickSetup() {
    try {
      this.logger.log('⚡ Starting quick setup for development...');

      // Clear existing data
      await this.seedDataService.clearSeedData();

      // Generate smaller dataset for quick testing
      const quickConfig: SeedConfig = {
        users: 50,
        companies: 10,
        jobs: 50,
        applications: 100,
        savedJobs: 75,
      };

      await this.seedDataService.generateSeedData(quickConfig);

      // Quick training with fewer epochs
      const quickTrainingConfig = {
        epochs: 20,
        batchSize: 16,
        learningRate: 0.001,
        validationSplit: 0.2,
        dropoutRate: 0.3,
        hiddenUnits: [64, 32],
      };

      const metrics =
        await this.aiTrainerService.trainRecommendationModel(
          quickTrainingConfig,
        );

      return {
        success: true,
        message:
          'Quick setup completed! Your AI recommendation system is ready for development.',
        setup: 'development',
        dataGenerated: quickConfig,
        trainingResults: {
          accuracy: `${(metrics.accuracy * 100).toFixed(2)}%`,
          trainingTime: `${(metrics.trainingTime / 1000).toFixed(2)}s`,
          dataPoints: metrics.dataPoints,
        },
        readyToUse: true,
        testEndpoints: [
          'GET /recommendation/jobs/:userId - Get job recommendations',
          'POST /ai/training/status - Check model status',
        ],
      };
    } catch (error) {
      this.logger.error('Error in quick setup:', error);
      throw new HttpException(
        'Quick setup failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
