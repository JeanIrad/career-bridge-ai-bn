import { Module } from '@nestjs/common';
import { MentorshipController } from './mentorship.controller';
import { MentorshipService } from './mentorship.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MentorshipController],
  providers: [MentorshipService],
  exports: [MentorshipService],
})
export class MentorshipModule {}
