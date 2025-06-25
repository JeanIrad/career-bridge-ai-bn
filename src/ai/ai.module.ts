import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiTrainerService } from './ai-trainer.service';
import { AiTrainingController } from './training-controller';
import { SeedDataService } from './seed-data.service';
import { SeedDataController } from './seed-data.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiTrainingController, SeedDataController],
  providers: [AiService, AiTrainerService, SeedDataService],
  exports: [AiService, AiTrainerService, SeedDataService],
})
export class AiModule {}
