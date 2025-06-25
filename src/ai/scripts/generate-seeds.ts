import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeedDataService } from '../seed-data.service';
import { AiTrainerService } from '../ai-trainer.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('SeedDataScript');

async function generateSeedsAndTrain() {
  logger.log('🚀 Starting AI Seed Data Generation and Training Script...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const seedDataService = app.get(SeedDataService);
    const aiTrainerService = app.get(AiTrainerService);

    // Parse command line arguments
    const args = process.argv.slice(2);
    const isQuick = args.includes('--quick');
    const clearData = !args.includes('--no-clear');

    if (clearData) {
      logger.log('🗑️ Clearing existing seed data...');
      await seedDataService.clearSeedData();
    }

    // Configure based on quick flag
    const seedConfig = isQuick
      ? {
          users: 50,
          companies: 10,
          jobs: 50,
          applications: 100,
          savedJobs: 75,
        }
      : {
          users: 100,
          companies: 20,
          jobs: 100,
          applications: 200,
          savedJobs: 150,
        };

    const trainingConfig = isQuick
      ? {
          epochs: 20,
          batchSize: 16,
          learningRate: 0.001,
          validationSplit: 0.2,
          dropoutRate: 0.3,
          hiddenUnits: [64, 32],
        }
      : {
          epochs: 50,
          batchSize: 32,
          learningRate: 0.001,
          validationSplit: 0.2,
          dropoutRate: 0.3,
          hiddenUnits: [128, 64, 32],
        };

    // Step 1: Generate seed data
    logger.log(`🌱 Generating ${isQuick ? 'quick' : 'full'} seed dataset...`);
    await seedDataService.generateSeedData(seedConfig);
    logger.log('✅ Seed data generation completed');

    // Step 2: Train AI model
    logger.log(
      `🤖 Training AI model with ${isQuick ? 'quick' : 'full'} configuration...`,
    );
    const startTime = Date.now();
    const metrics =
      await aiTrainerService.trainRecommendationModel(trainingConfig);
    const endTime = Date.now();

    // Display results
    logger.log('🎉 AI Training Completed Successfully!');
    logger.log('==========================================');
    logger.log(`📊 Data Points: ${metrics.dataPoints}`);
    logger.log(`🎯 Final Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
    logger.log(`📉 Final Loss: ${metrics.loss.toFixed(4)}`);
    logger.log(
      `⏱️ Training Time: ${((endTime - startTime) / 1000).toFixed(2)}s`,
    );
    logger.log(`🔄 Epochs: ${metrics.epochs}`);
    logger.log('==========================================');

    logger.log('🚀 Your AI recommendation system is ready!');
    logger.log('Next steps:');
    logger.log('  1. Start your NestJS server: npm run start:dev');
    logger.log('  2. Test recommendations: GET /recommendation/jobs/:userId');
    logger.log('  3. Check model status: POST /ai/training/status');
  } catch (error) {
    logger.error('❌ Error in seed generation and training:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Display usage information
function showUsage() {
  console.log('');
  console.log('🌱 AI Seed Data Generation and Training Script');
  console.log('==============================================');
  console.log('');
  console.log('Usage:');
  console.log(
    '  npm run ai:generate-seeds          # Full dataset and training',
  );
  console.log(
    '  npm run ai:generate-seeds --quick  # Quick dataset for development',
  );
  console.log('  npm run ai:generate-seeds --no-clear # Keep existing data');
  console.log('');
  console.log('What this script does:');
  console.log('  1. 🗑️ Clears existing seed data (unless --no-clear)');
  console.log('  2. 🌱 Generates realistic fake data using Faker.js');
  console.log('  3. 🤖 Trains the AI recommendation model');
  console.log('  4. 📊 Displays training metrics and next steps');
  console.log('');
  console.log('Generated data includes:');
  console.log('  • Users with skills, experiences, education');
  console.log('  • Companies with realistic job postings');
  console.log('  • Job applications and saved jobs');
  console.log('  • Realistic engagement patterns for training');
  console.log('');
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Run the script
generateSeedsAndTrain().catch((error) => {
  logger.error('Script failed:', error);
  process.exit(1);
});
