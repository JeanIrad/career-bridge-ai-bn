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
import { CompaniesModule } from './companies/companies.module';
import { UniversityPartnersModule } from './university-partners/university-partners.module';
import { ApplicationsModule } from './applications/applications.module';
import { EventsModule } from './events/events.module';
import { MentorshipModule } from './mentorship/mentorship.module';
import { InternshipsModule } from './internships/internships.module';

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
    CompaniesModule,
    UniversityPartnersModule, // Company profile and document management
    ApplicationsModule, // Comprehensive application management
    EventsModule, // Comprehensive career events system
    MentorshipModule, // Comprehensive mentorship system
    InternshipsModule, // Comprehensive internship system
  ],
  controllers: [AppController, RecommendationController],
  providers: [AppService],
})
export class AppModule {}
