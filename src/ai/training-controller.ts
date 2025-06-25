import {
  Controller,
  Post,
  Get,
  Body,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { AiTrainerService, TrainingConfig } from './ai-trainer.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('AI Training')
@Controller('ai/training')
export class AiTrainingController {
  private readonly logger = new Logger(AiTrainingController.name);

  constructor(private readonly aiTrainerService: AiTrainerService) {}

  @Post('train')
  @ApiOperation({ summary: 'Train the AI recommendation model' })
  async trainModel(@Body() config?: Partial<TrainingConfig>) {
    try {
      this.logger.log('🚀 Starting AI model training...');

      const metrics =
        await this.aiTrainerService.trainRecommendationModel(config);

      return {
        success: true,
        message: 'AI model training completed successfully!',
        metrics,
        recommendations: [
          'The AI model is now ready to provide job recommendations',
          'Test the recommendations using the /recommendation endpoints',
          'Monitor model performance and retrain periodically with new data',
        ],
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
  @ApiOperation({ summary: 'Get AI training status' })
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

      return {
        modelTrained: modelExists && metadataExists,
        modelPath: modelExists ? `${modelPath}/model.json` : null,
        metadata,
        status: modelExists ? 'ready' : 'not_trained',
        recommendations: modelExists
          ? ['Model is ready for generating recommendations']
          : ['Train the model first using POST /ai/training/train'],
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
  @ApiOperation({ summary: 'Quick train with minimal settings' })
  async quickTrain() {
    try {
      this.logger.log('⚡ Starting quick training...');

      const quickConfig: Partial<TrainingConfig> = {
        epochs: 20,
        batchSize: 16,
        learningRate: 0.001,
        hiddenUnits: [64, 32],
      };

      const metrics =
        await this.aiTrainerService.trainRecommendationModel(quickConfig);

      return {
        success: true,
        message: 'Quick training completed!',
        metrics,
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
}
