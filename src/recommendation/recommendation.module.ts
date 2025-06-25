import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { CacheModule } from '../cache/cache.module';

// Services
import { RecommendationService } from './recommendation.service';
import { EnhancedRecommendationService } from './enhanced-recommendation.service';
import { LearningRecommendationService } from './learning-recommendation.service';
import { CareerPathService } from './career-path.service';
import { MarketIntelligenceService } from './market-intelligence.service';

// Controllers
import { RecommendationController } from './recommendation.controller';
import { EnhancedRecommendationController } from './enhanced-recommendation.controller';
import { LearningRecommendationController } from './learning-recommendation.controller';
import { CareerPathController } from './career-path.controller';
import { MarketIntelligenceController } from './market-intelligence.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [PrismaModule, AiModule, CacheModule],
  controllers: [
    RecommendationController,
    EnhancedRecommendationController,
    LearningRecommendationController,
    CareerPathController,
    MarketIntelligenceController,
  ],
  providers: [
    PrismaService,
    RecommendationService,
    EnhancedRecommendationService,
    LearningRecommendationService,
    CareerPathService,
    MarketIntelligenceService,
  ],
  exports: [
    RecommendationService,
    EnhancedRecommendationService,
    LearningRecommendationService,
    CareerPathService,
    MarketIntelligenceService,
  ],
})
export class RecommendationModule {}
