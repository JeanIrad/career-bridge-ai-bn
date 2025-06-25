#!/usr/bin/env ts-node

import { Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AiTrainerService } from '../ai-trainer.service';

async function trainAiModel() {
  const logger = new Logger('AI Training Script');

  try {
    logger.log('🚀 Initializing services...');

    // Create Prisma service instance
    const prisma = new PrismaService();
    await prisma.$connect();

    // Create AI trainer service
    const aiTrainerService = new AiTrainerService(prisma);

    logger.log('🤖 Starting AI model training...');

    // Configure training parameters
    const trainingConfig = {
      epochs: 50, // Number of training iterations
      batchSize: 32, // Samples per batch
      learningRate: 0.001, // How fast the model learns
      validationSplit: 0.2, // Percentage for validation
      dropoutRate: 0.3, // Prevent overfitting
      hiddenUnits: [128, 64, 32], // Neural network architecture
    };

    // Start training
    const startTime = Date.now();
    const metrics =
      await aiTrainerService.trainRecommendationModel(trainingConfig);
    const duration = (Date.now() - startTime) / 1000;

    // Display results
    logger.log('✅ Training completed successfully!');
    logger.log(`📊 Training Results:`);
    logger.log(`   • Data Points: ${metrics.dataPoints}`);
    logger.log(`   • Final Loss: ${metrics.loss.toFixed(4)}`);
    logger.log(`   • Training Time: ${duration.toFixed(2)}s`);
    logger.log(`   • Epochs: ${metrics.epochs}`);

    logger.log('🎯 Next Steps:');
    logger.log('   1. Your AI model is now trained and ready!');
    logger.log('   2. Start your application to use job recommendations');
    logger.log('   3. Test recommendations through the API endpoints');
    logger.log('   4. Monitor performance and retrain as needed');

    await prisma.$disconnect();
  } catch (error) {
    logger.error('❌ Training failed:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the training
if (require.main === module) {
  trainAiModel();
}

export { trainAiModel };
