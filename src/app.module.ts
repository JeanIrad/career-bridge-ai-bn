import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ChatsModule } from './chats/chats.module';
import { MailModule } from './mail/mail.module';
import { UploadModule } from './upload/upload.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { AiModule } from './ai/ai.module';
import { CacheModule } from './cache/cache.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RecommendationController } from './recommendation/recommendation.controller';
import { ContentModerationModule } from './content-moderation/content-moderation.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule, // Now includes all enhanced auth features
    UsersModule,
    ChatsModule,
    MailModule,
    UploadModule, // File upload with Cloudinary
    NotificationsModule,
    RecommendationModule,
    AiModule,
    CacheModule,
    AnalyticsModule, // Comprehensive analytics and reporting
    ContentModerationModule, // Content moderation and safety
    JobsModule, // Job posting and application management
  ],
  controllers: [AppController, RecommendationController],
  providers: [AppService],
})
export class AppModule {}
