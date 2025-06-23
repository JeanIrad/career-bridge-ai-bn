import { Module } from '@nestjs/common';
import { UniversityPartnersController } from './university-partners.controller';
import { UniversityPartnersService } from './university-partners.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UniversityPartnersController],
  providers: [UniversityPartnersService],
  exports: [UniversityPartnersService],
})
export class UniversityPartnersModule {}
