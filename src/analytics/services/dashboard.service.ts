import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  UserRole,
  ApplicationStatus,
  JobStatus,
  EventStatus,
} from '@prisma/client';
import {
  AnalyticsService,
  AnalyticsFilter,
  MetricData,
  ChartData,
  TimeSeriesData,
} from './analytics.service';
import { KpiService, KPI } from './kpi.service';

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'progress' | 'list';
  size: 'small' | 'medium' | 'large';
  data: any;
  refreshInterval?: number; // in seconds
  lastUpdated: Date;
}

export interface RoleDashboard {
  role: UserRole;
  widgets: DashboardWidget[];
  quickActions: QuickAction[];
  notifications: DashboardNotification[];
  summary: DashboardSummary;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  read: boolean;
}

export interface DashboardSummary {
  totalMetrics: number;
  criticalAlerts: number;
  pendingActions: number;
  lastUpdated: Date;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
    private kpiService: KpiService,
  ) {}

  /**
   * Get Admin Dashboard
   */
  async getAdminDashboard(filter?: AnalyticsFilter): Promise<RoleDashboard> {
    const [
      platformOverview,
      userGrowthData,
      applicationStats,
      topCompanies,
      skillDemand,
      adminKPIs,
    ] = await Promise.all([
      this.analyticsService.getPlatformOverview(filter),
      this.analyticsService.getUserGrowthData(filter),
      this.analyticsService.getApplicationSuccessRates(filter),
      this.analyticsService.getTopCompanies(5, filter),
      this.analyticsService.getSkillDemandAnalysis(filter),
      this.kpiService.getAdminKPIs(filter),
    ]);

    const widgets: DashboardWidget[] = [
      {
        id: 'platform-overview',
        title: 'Platform Overview',
        type: 'metric',
        size: 'large',
        data: {
          metrics: [
            platformOverview.totalUsers,
            platformOverview.activeUsers,
            platformOverview.totalJobs,
            platformOverview.totalApplications,
          ],
        },
        refreshInterval: 300,
        lastUpdated: new Date(),
      },
      {
        id: 'user-growth-chart',
        title: 'User Growth Trend',
        type: 'chart',
        size: 'medium',
        data: {
          chartType: 'line',
          labels: userGrowthData.map((d) => d.date),
          datasets: [
            {
              label: 'New Users',
              data: userGrowthData.map((d) => d.value),
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
            },
          ],
        },
        refreshInterval: 600,
        lastUpdated: new Date(),
      },
      {
        id: 'application-stats',
        title: 'Application Statistics',
        type: 'chart',
        size: 'medium',
        data: {
          chartType: 'doughnut',
          labels: ['Accepted', 'Rejected', 'Pending'],
          datasets: [
            {
              data: [
                applicationStats.acceptedApplications,
                applicationStats.rejectedApplications,
                applicationStats.pendingApplications,
              ],
              backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
            },
          ],
          centerText: `${applicationStats.successRate.toFixed(1)}%`,
          centerLabel: 'Success Rate',
        },
        refreshInterval: 300,
        lastUpdated: new Date(),
      },
      {
        id: 'top-companies',
        title: 'Top Performing Companies',
        type: 'table',
        size: 'medium',
        data: {
          headers: [
            'Company',
            'Jobs Posted',
            'Applications',
            'Hires',
            'Avg. Time to Hire',
          ],
          rows: topCompanies.map((company) => [
            company.name,
            company.jobsPosted,
            company.applicationsReceived,
            company.successfulHires,
            `${company.averageTimeToHire} days`,
          ]),
        },
        refreshInterval: 900,
        lastUpdated: new Date(),
      },
      {
        id: 'skill-demand',
        title: 'Skills in Demand',
        type: 'chart',
        size: 'medium',
        data: {
          chartType: 'bar',
          labels: skillDemand.slice(0, 10).map((s) => s.skill),
          datasets: [
            {
              label: 'Job Postings',
              data: skillDemand.slice(0, 10).map((s) => s.demand),
              backgroundColor: '#8B5CF6',
            },
          ],
        },
        refreshInterval: 1800,
        lastUpdated: new Date(),
      },
      {
        id: 'kpi-summary',
        title: 'Key Performance Indicators',
        type: 'progress',
        size: 'large',
        data: {
          kpis: adminKPIs.kpis.map((kpi) => ({
            name: kpi.name,
            value: typeof kpi.value === 'string' ? kpi.value : kpi.value,
            target: kpi.target,
            status: kpi.status,
            trend: kpi.trend,
          })),
        },
        refreshInterval: 300,
        lastUpdated: new Date(),
      },
    ];

    const quickActions: QuickAction[] = [
      {
        id: 'create-user',
        title: 'Create User',
        description: 'Add a new user to the platform',
        icon: 'user-plus',
        action: '/admin/users/create',
        priority: 'medium',
      },
      {
        id: 'approve-documents',
        title: 'Approve Documents',
        description: 'Review pending document verifications',
        icon: 'file-check',
        action: '/admin/documents/pending',
        priority: 'high',
      },
      {
        id: 'generate-report',
        title: 'Generate Report',
        description: 'Create a comprehensive platform report',
        icon: 'bar-chart',
        action: '/admin/reports/generate',
        priority: 'low',
      },
      {
        id: 'system-settings',
        title: 'System Settings',
        description: 'Configure platform settings',
        icon: 'settings',
        action: '/admin/settings',
        priority: 'low',
      },
    ];

    const notifications = await this.getAdminNotifications();

    return {
      role: UserRole.ADMIN,
      widgets,
      quickActions,
      notifications,
      summary: {
        totalMetrics: adminKPIs.kpis.length,
        criticalAlerts: adminKPIs.summary.criticalKPIs,
        pendingActions: notifications.filter(
          (n) => !n.read && n.priority === 'high',
        ).length,
        lastUpdated: new Date(),
      },
    };
  }

  /**
   * Get Student Dashboard
   */
  async getStudentDashboard(
    userId: string,
    filter?: AnalyticsFilter,
  ): Promise<RoleDashboard> {
    const [
      studentKPIs,
      recentApplications,
      recommendedJobs,
      upcomingEvents,
      skillProgress,
    ] = await Promise.all([
      this.kpiService.getStudentKPIs(userId, filter),
      this.getStudentRecentApplications(userId),
      this.getStudentRecommendedJobs(userId),
      this.getStudentUpcomingEvents(userId),
      this.getStudentSkillProgress(userId),
    ]);

    const widgets: DashboardWidget[] = [
      {
        id: 'student-kpis',
        title: 'Your Progress',
        type: 'metric',
        size: 'large',
        data: {
          metrics: studentKPIs.kpis.slice(0, 4).map((kpi) => ({
            label: kpi.name,
            value: kpi.value,
            change: kpi.changePercentage,
            trend: kpi.trend,
            status: kpi.status,
          })),
        },
        refreshInterval: 600,
        lastUpdated: new Date(),
      },
      {
        id: 'recent-applications',
        title: 'Recent Applications',
        type: 'table',
        size: 'medium',
        data: {
          headers: ['Job Title', 'Company', 'Applied', 'Status'],
          rows: recentApplications.map((app) => [
            app.jobTitle,
            app.companyName,
            app.appliedDate,
            app.status,
          ]),
        },
        refreshInterval: 300,
        lastUpdated: new Date(),
      },
      {
        id: 'recommended-jobs',
        title: 'Recommended for You',
        type: 'list',
        size: 'medium',
        data: {
          items: recommendedJobs.map((job) => ({
            id: job.id,
            title: job.title,
            subtitle: job.company,
            description: job.description,
            badge: `${job.matchScore}% match`,
            action: `/jobs/${job.id}`,
          })),
        },
        refreshInterval: 1800,
        lastUpdated: new Date(),
      },
      {
        id: 'upcoming-events',
        title: 'Upcoming Events',
        type: 'list',
        size: 'medium',
        data: {
          items: upcomingEvents.map((event) => ({
            id: event.id,
            title: event.title,
            subtitle: event.date,
            description: event.description,
            badge: event.type,
            action: `/events/${event.id}`,
          })),
        },
        refreshInterval: 900,
        lastUpdated: new Date(),
      },
      {
        id: 'skill-progress',
        title: 'Skill Development',
        type: 'progress',
        size: 'medium',
        data: {
          skills: skillProgress.map((skill) => ({
            name: skill.name,
            level: skill.level,
            progress: skill.progress,
            target: skill.target,
          })),
        },
        refreshInterval: 1800,
        lastUpdated: new Date(),
      },
    ];

    const quickActions: QuickAction[] = [
      {
        id: 'search-jobs',
        title: 'Search Jobs',
        description: 'Find your next opportunity',
        icon: 'search',
        action: '/jobs/search',
        priority: 'high',
      },
      {
        id: 'update-profile',
        title: 'Update Profile',
        description: 'Keep your profile current',
        icon: 'user',
        action: '/profile/edit',
        priority: 'medium',
      },
      {
        id: 'schedule-counseling',
        title: 'Career Counseling',
        description: 'Book a session with a counselor',
        icon: 'calendar',
        action: '/counseling/book',
        priority: 'medium',
      },
      {
        id: 'skill-assessment',
        title: 'Skill Assessment',
        description: 'Take a skill assessment test',
        icon: 'award',
        action: '/assessments',
        priority: 'low',
      },
    ];

    const notifications = await this.getStudentNotifications(userId);

    return {
      role: UserRole.STUDENT,
      widgets,
      quickActions,
      notifications,
      summary: {
        totalMetrics: studentKPIs.kpis.length,
        criticalAlerts: studentKPIs.summary.criticalKPIs,
        pendingActions: notifications.filter(
          (n) => !n.read && n.priority === 'high',
        ).length,
        lastUpdated: new Date(),
      },
    };
  }

  /**
   * Get Employer Dashboard
   */
  async getEmployerDashboard(
    userId: string,
    filter?: AnalyticsFilter,
  ): Promise<RoleDashboard> {
    const [
      employerKPIs,
      recentApplications,
      activeJobs,
      candidatePipeline,
      hiringMetrics,
    ] = await Promise.all([
      this.kpiService.getEmployerKPIs(userId, filter),
      this.getEmployerRecentApplications(userId),
      this.getEmployerActiveJobs(userId),
      this.getEmployerCandidatePipeline(userId),
      this.getEmployerHiringMetrics(userId),
    ]);

    const widgets: DashboardWidget[] = [
      {
        id: 'employer-kpis',
        title: 'Recruitment Metrics',
        type: 'metric',
        size: 'large',
        data: {
          metrics: employerKPIs.kpis.slice(0, 4).map((kpi) => ({
            label: kpi.name,
            value: kpi.value,
            change: kpi.changePercentage,
            trend: kpi.trend,
            status: kpi.status,
          })),
        },
        refreshInterval: 600,
        lastUpdated: new Date(),
      },
      {
        id: 'recent-applications',
        title: 'Recent Applications',
        type: 'table',
        size: 'medium',
        data: {
          headers: ['Candidate', 'Position', 'Applied', 'Status', 'Score'],
          rows: recentApplications.map((app) => [
            app.candidateName,
            app.position,
            app.appliedDate,
            app.status,
            app.score,
          ]),
        },
        refreshInterval: 300,
        lastUpdated: new Date(),
      },
      {
        id: 'active-jobs',
        title: 'Active Job Postings',
        type: 'list',
        size: 'medium',
        data: {
          items: activeJobs.map((job) => ({
            id: job.id,
            title: job.title,
            subtitle: `${job.applicationsCount} applications`,
            description: job.description,
            badge: job.status,
            action: `/employer/jobs/${job.id}`,
          })),
        },
        refreshInterval: 600,
        lastUpdated: new Date(),
      },
      {
        id: 'candidate-pipeline',
        title: 'Candidate Pipeline',
        type: 'chart',
        size: 'medium',
        data: {
          chartType: 'funnel',
          stages: candidatePipeline.map((stage) => ({
            name: stage.stage,
            value: stage.count,
            percentage: stage.percentage,
          })),
        },
        refreshInterval: 900,
        lastUpdated: new Date(),
      },
      {
        id: 'hiring-metrics',
        title: 'Hiring Performance',
        type: 'chart',
        size: 'medium',
        data: {
          chartType: 'line',
          labels: hiringMetrics.map((m) => m.month),
          datasets: [
            {
              label: 'Applications',
              data: hiringMetrics.map((m) => m.applications),
              borderColor: '#3B82F6',
            },
            {
              label: 'Hires',
              data: hiringMetrics.map((m) => m.hires),
              borderColor: '#10B981',
            },
          ],
        },
        refreshInterval: 1800,
        lastUpdated: new Date(),
      },
    ];

    const quickActions: QuickAction[] = [
      {
        id: 'post-job',
        title: 'Post New Job',
        description: 'Create a new job posting',
        icon: 'plus',
        action: '/employer/jobs/create',
        priority: 'high',
      },
      {
        id: 'review-applications',
        title: 'Review Applications',
        description: 'Review pending applications',
        icon: 'file-text',
        action: '/employer/applications',
        priority: 'high',
      },
      {
        id: 'schedule-interviews',
        title: 'Schedule Interviews',
        description: 'Schedule candidate interviews',
        icon: 'calendar',
        action: '/employer/interviews',
        priority: 'medium',
      },
      {
        id: 'company-profile',
        title: 'Update Company Profile',
        description: 'Keep your company profile updated',
        icon: 'building',
        action: '/employer/profile',
        priority: 'low',
      },
    ];

    const notifications = await this.getEmployerNotifications(userId);

    return {
      role: UserRole.EMPLOYER,
      widgets,
      quickActions,
      notifications,
      summary: {
        totalMetrics: employerKPIs.kpis.length,
        criticalAlerts: employerKPIs.summary.criticalKPIs,
        pendingActions: notifications.filter(
          (n) => !n.read && n.priority === 'high',
        ).length,
        lastUpdated: new Date(),
      },
    };
  }

  // Helper methods for fetching specific data
  private async getAdminNotifications(): Promise<DashboardNotification[]> {
    const pendingDocuments = await this.prisma.document.count({
      where: { verificationStatus: 'PENDING', deletedAt: null },
    });

    const notifications: DashboardNotification[] = [];

    if (pendingDocuments > 0) {
      notifications.push({
        id: 'pending-documents',
        title: 'Documents Pending Verification',
        message: `${pendingDocuments} documents need your review`,
        type: 'warning',
        priority: 'high',
        timestamp: new Date(),
        read: false,
      });
    }

    return notifications;
  }

  private async getStudentRecentApplications(userId: string) {
    const applications = await this.prisma.jobApplication.findMany({
      where: { userId, deletedAt: null },
      include: {
        job: {
          include: { company: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return applications.map((app) => ({
      jobTitle: app.job.title,
      companyName: app.job.company.name,
      appliedDate: app.createdAt.toLocaleDateString(),
      status: app.status,
    }));
  }

  private async getStudentRecommendedJobs(userId: string) {
    const recommendations = await this.prisma.jobRecommendation.findMany({
      where: { userId },
      include: {
        job: {
          include: { company: true },
        },
      },
      orderBy: { score: 'desc' },
      take: 5,
    });

    return recommendations.map((rec) => ({
      id: rec.job.id,
      title: rec.job.title,
      company: rec.job.company.name,
      description: rec.job.description.substring(0, 100) + '...',
      matchScore: Math.round(rec.score * 100),
    }));
  }

  private async getStudentUpcomingEvents(userId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        startDate: { gte: new Date() },
        deletedAt: null,
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.startDate.toLocaleDateString(),
      description: event.description.substring(0, 100) + '...',
      type: event.type,
    }));
  }

  private async getStudentSkillProgress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { skills: true },
    });

    // Mock skill progress data
    return (user?.skills || []).map((skill) => ({
      name: skill.name,
      level: (skill as any).level || 0,
      progress: Math.random() * 100,
      target: 100,
    }));
  }

  private async getStudentNotifications(
    userId: string,
  ): Promise<DashboardNotification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return notifications.map((notif) => ({
      id: notif.id,
      title: notif.title,
      message: notif.content,
      type: 'info' as const,
      priority:
        (notif.priority?.toLowerCase() as 'high' | 'medium' | 'low') ||
        'medium',
      timestamp: notif.createdAt,
      read: notif.read,
    }));
  }

  private async getEmployerRecentApplications(userId: string) {
    const jobs = await this.prisma.job.findMany({
      where: { postedById: userId, deletedAt: null },
      select: { id: true },
    });
    const jobIds = jobs.map((job) => job.id);

    const applications = await this.prisma.jobApplication.findMany({
      where: { jobId: { in: jobIds }, deletedAt: null },
      include: {
        user: true,
        job: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return applications.map((app) => ({
      candidateName: `${app.user.firstName} ${app.user.lastName}`,
      position: app.job.title,
      appliedDate: app.createdAt.toLocaleDateString(),
      status: app.status,
      score: '85%', // Mock score
    }));
  }

  private async getEmployerActiveJobs(userId: string) {
    const jobs = await this.prisma.job.findMany({
      where: {
        postedById: userId,
        status: JobStatus.ACTIVE,
        deletedAt: null,
      },
      include: {
        applications: {
          where: { deletedAt: null },
        },
      },
      take: 5,
    });

    return jobs.map((job) => ({
      id: job.id,
      title: job.title,
      applicationsCount: job.applications.length,
      description: job.description.substring(0, 100) + '...',
      status: job.status,
    }));
  }

  private async getEmployerCandidatePipeline(userId: string) {
    const jobs = await this.prisma.job.findMany({
      where: { postedById: userId, deletedAt: null },
      select: { id: true },
    });
    const jobIds = jobs.map((job) => job.id);

    const applications = await this.prisma.jobApplication.groupBy({
      by: ['status'],
      where: { jobId: { in: jobIds }, deletedAt: null },
      _count: { status: true },
    });

    const total = applications.reduce((sum, app) => sum + app._count.status, 0);

    return applications.map((app) => ({
      stage: app.status,
      count: app._count.status,
      percentage: total > 0 ? (app._count.status / total) * 100 : 0,
    }));
  }

  private async getEmployerHiringMetrics(userId: string) {
    // Mock data for hiring metrics over time
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month) => ({
      month,
      applications: Math.floor(Math.random() * 50) + 20,
      hires: Math.floor(Math.random() * 10) + 2,
    }));
  }

  private async getEmployerNotifications(
    userId: string,
  ): Promise<DashboardNotification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return notifications.map((notif) => ({
      id: notif.id,
      title: notif.title,
      message: notif.content,
      type: 'info' as const,
      priority:
        (notif.priority?.toLowerCase() as 'high' | 'medium' | 'low') ||
        'medium',
      timestamp: notif.createdAt,
      read: notif.read,
    }));
  }
}
