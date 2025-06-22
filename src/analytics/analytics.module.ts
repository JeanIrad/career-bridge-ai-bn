import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

// Services
import { AnalyticsService } from './services/analytics.service';
import { DashboardService } from './services/dashboard.service';
import { ReportsService } from './services/reports.service';
import { KpiService } from './services/kpi.service';
import { UserAnalyticsService } from './services/user-analytics.service';
import { EmployerAnalyticsService } from './employer-analytics.service';

// Controllers
import { DashboardController } from './controllers/dashboard.controller';
import { ReportsController } from './controllers/reports.controller';
import { EmployerAnalyticsController } from './employer-analytics.controller';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  controllers: [
    DashboardController,
    ReportsController,
    EmployerAnalyticsController,
  ],
  providers: [
    AnalyticsService,
    DashboardService,
    ReportsService,
    KpiService,
    UserAnalyticsService,
    EmployerAnalyticsService,
  ],
  exports: [
    AnalyticsService,
    DashboardService,
    ReportsService,
    KpiService,
    UserAnalyticsService,
    EmployerAnalyticsService,
  ],
})
export class AnalyticsModule {}
