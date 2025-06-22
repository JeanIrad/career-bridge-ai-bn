import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  UserRole,
  ApplicationStatus,
  JobStatus,
  EventStatus,
  VerificationStatus,
} from '@prisma/client';
import { AnalyticsFilter, DateRange, MetricData } from './analytics.service';

export interface KPI {
  id: string;
  name: string;
  description: string;
  value: number | string;
  target?: number;
  unit: string;
  category: 'user' | 'job' | 'event' | 'company' | 'platform' | 'financial';
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  lastUpdated: Date;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface RoleBasedKPIs {
  role: UserRole;
  kpis: KPI[];
  summary: {
    totalKPIs: number;
    excellentKPIs: number;
    warningKPIs: number;
    criticalKPIs: number;
  };
}

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get KPIs for Admin role
   */
  async getAdminKPIs(filter?: AnalyticsFilter): Promise<RoleBasedKPIs> {
    const { startDate, endDate } = this.getDateRange(filter?.dateRange);

    const [
      totalUsers,
      activeUsers,
      totalJobs,
      totalApplications,
      successfulPlacements,
      totalEvents,
      eventAttendance,
      totalCompanies,
      verifiedDocuments,
      pendingDocuments,
      systemUptime,
      averageResponseTime,
    ] = await Promise.all([
      this.getTotalUsers(startDate, endDate),
      this.getActiveUsers(startDate, endDate),
      this.getTotalJobs(startDate, endDate),
      this.getTotalApplications(startDate, endDate),
      this.getSuccessfulPlacements(startDate, endDate),
      this.getTotalEvents(startDate, endDate),
      this.getEventAttendance(startDate, endDate),
      this.getTotalCompanies(startDate, endDate),
      this.getVerifiedDocuments(startDate, endDate),
      this.getPendingDocuments(),
      this.getSystemUptime(),
      this.getAverageResponseTime(),
    ]);

    const kpis: KPI[] = [
      {
        id: 'total-users',
        name: 'Total Users',
        description: 'Total number of registered users',
        value: totalUsers.current,
        target: totalUsers.target,
        unit: 'users',
        category: 'user',
        trend: totalUsers.trend,
        changePercentage: totalUsers.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(totalUsers.current, totalUsers.target),
      },
      {
        id: 'active-users',
        name: 'Active Users',
        description: 'Users active in the last 30 days',
        value: activeUsers.current,
        target: activeUsers.target,
        unit: 'users',
        category: 'user',
        trend: activeUsers.trend,
        changePercentage: activeUsers.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(activeUsers.current, activeUsers.target),
      },
      {
        id: 'job-postings',
        name: 'Job Postings',
        description: 'Total active job postings',
        value: totalJobs.current,
        target: totalJobs.target,
        unit: 'jobs',
        category: 'job',
        trend: totalJobs.trend,
        changePercentage: totalJobs.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(totalJobs.current, totalJobs.target),
      },
      {
        id: 'job-applications',
        name: 'Job Applications',
        description: 'Total job applications submitted',
        value: totalApplications.current,
        target: totalApplications.target,
        unit: 'applications',
        category: 'job',
        trend: totalApplications.trend,
        changePercentage: totalApplications.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(
          totalApplications.current,
          totalApplications.target,
        ),
      },
      {
        id: 'placement-rate',
        name: 'Placement Rate',
        description: 'Percentage of successful job placements',
        value: `${successfulPlacements.rate.toFixed(1)}%`,
        target: 75,
        unit: '%',
        category: 'job',
        trend: successfulPlacements.trend,
        changePercentage: successfulPlacements.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(successfulPlacements.rate, 75),
      },
      {
        id: 'total-events',
        name: 'Total Events',
        description: 'Total events organized',
        value: totalEvents.current,
        target: totalEvents.target,
        unit: 'events',
        category: 'event',
        trend: totalEvents.trend,
        changePercentage: totalEvents.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(totalEvents.current, totalEvents.target),
      },
      {
        id: 'event-attendance',
        name: 'Event Attendance Rate',
        description: 'Average event attendance rate',
        value: `${eventAttendance.rate.toFixed(1)}%`,
        target: 80,
        unit: '%',
        category: 'event',
        trend: eventAttendance.trend,
        changePercentage: eventAttendance.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(eventAttendance.rate, 80),
      },
      {
        id: 'partner-companies',
        name: 'Partner Companies',
        description: 'Total registered companies',
        value: totalCompanies.current,
        target: totalCompanies.target,
        unit: 'companies',
        category: 'company',
        trend: totalCompanies.trend,
        changePercentage: totalCompanies.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(
          totalCompanies.current,
          totalCompanies.target,
        ),
      },
      {
        id: 'document-verification',
        name: 'Document Verification Rate',
        description: 'Percentage of verified documents',
        value: `${verifiedDocuments.rate.toFixed(1)}%`,
        target: 90,
        unit: '%',
        category: 'platform',
        trend: verifiedDocuments.trend,
        changePercentage: verifiedDocuments.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(verifiedDocuments.rate, 90),
      },
      {
        id: 'pending-documents',
        name: 'Pending Documents',
        description: 'Documents awaiting verification',
        value: pendingDocuments,
        target: 50,
        unit: 'documents',
        category: 'platform',
        trend: 'stable',
        changePercentage: 0,
        lastUpdated: new Date(),
        status: this.getKPIStatus(pendingDocuments, 50, true), // Reverse logic for pending items
      },
      {
        id: 'system-uptime',
        name: 'System Uptime',
        description: 'Platform availability percentage',
        value: `${systemUptime.toFixed(2)}%`,
        target: 99.9,
        unit: '%',
        category: 'platform',
        trend: 'stable',
        changePercentage: 0,
        lastUpdated: new Date(),
        status: this.getKPIStatus(systemUptime, 99.9),
      },
      {
        id: 'response-time',
        name: 'Average Response Time',
        description: 'Average API response time',
        value: `${averageResponseTime}ms`,
        target: 200,
        unit: 'ms',
        category: 'platform',
        trend: 'stable',
        changePercentage: 0,
        lastUpdated: new Date(),
        status: this.getKPIStatus(averageResponseTime, 200, true), // Reverse logic for response time
      },
    ];

    return this.buildRoleBasedKPIs(UserRole.ADMIN, kpis);
  }

  /**
   * Get KPIs for Student role
   */
  async getStudentKPIs(
    userId: string,
    filter?: AnalyticsFilter,
  ): Promise<RoleBasedKPIs> {
    const { startDate, endDate } = this.getDateRange(filter?.dateRange);

    const [
      applicationsSent,
      applicationsAccepted,
      profileViews,
      networkConnections,
      eventsAttended,
      skillsAssessed,
    ] = await Promise.all([
      this.getUserApplications(userId, startDate, endDate),
      this.getUserAcceptedApplications(userId, startDate, endDate),
      this.getUserProfileViews(userId, startDate, endDate),
      this.getUserNetworkConnections(userId),
      this.getUserEventsAttended(userId, startDate, endDate),
      this.getUserSkillsAssessed(userId),
    ]);

    const kpis: KPI[] = [
      {
        id: 'applications-sent',
        name: 'Applications Sent',
        description: 'Total job applications submitted',
        value: applicationsSent.current,
        target: 10,
        unit: 'applications',
        category: 'job',
        trend: applicationsSent.trend,
        changePercentage: applicationsSent.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(applicationsSent.current, 10),
      },
      {
        id: 'success-rate',
        name: 'Application Success Rate',
        description: 'Percentage of accepted applications',
        value: `${applicationsAccepted.rate.toFixed(1)}%`,
        target: 20,
        unit: '%',
        category: 'job',
        trend: applicationsAccepted.trend,
        changePercentage: applicationsAccepted.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(applicationsAccepted.rate, 20),
      },
      {
        id: 'profile-views',
        name: 'Profile Views',
        description: 'Number of profile views received',
        value: profileViews.current,
        target: 50,
        unit: 'views',
        category: 'user',
        trend: profileViews.trend,
        changePercentage: profileViews.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(profileViews.current, 50),
      },
      {
        id: 'network-connections',
        name: 'Network Connections',
        description: 'Total professional connections',
        value: networkConnections,
        target: 100,
        unit: 'connections',
        category: 'user',
        trend: 'stable',
        changePercentage: 0,
        lastUpdated: new Date(),
        status: this.getKPIStatus(networkConnections, 100),
      },
      {
        id: 'events-attended',
        name: 'Events Attended',
        description: 'Career events attended',
        value: eventsAttended.current,
        target: 5,
        unit: 'events',
        category: 'event',
        trend: eventsAttended.trend,
        changePercentage: eventsAttended.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(eventsAttended.current, 5),
      },
      {
        id: 'skills-assessed',
        name: 'Skills Assessed',
        description: 'Number of skills with assessments',
        value: skillsAssessed,
        target: 10,
        unit: 'skills',
        category: 'user',
        trend: 'stable',
        changePercentage: 0,
        lastUpdated: new Date(),
        status: this.getKPIStatus(skillsAssessed, 10),
      },
    ];

    return this.buildRoleBasedKPIs(UserRole.STUDENT, kpis);
  }

  /**
   * Get KPIs for Employer role
   */
  async getEmployerKPIs(
    userId: string,
    filter?: AnalyticsFilter,
  ): Promise<RoleBasedKPIs> {
    const { startDate, endDate } = this.getDateRange(filter?.dateRange);

    const [
      jobsPosted,
      applicationsReceived,
      candidatesHired,
      timeToHire,
      companyViews,
      activeJobs,
    ] = await Promise.all([
      this.getEmployerJobsPosted(userId, startDate, endDate),
      this.getEmployerApplicationsReceived(userId, startDate, endDate),
      this.getEmployerCandidatesHired(userId, startDate, endDate),
      this.getEmployerTimeToHire(userId, startDate, endDate),
      this.getEmployerCompanyViews(userId, startDate, endDate),
      this.getEmployerActiveJobs(userId),
    ]);

    const kpis: KPI[] = [
      {
        id: 'jobs-posted',
        name: 'Jobs Posted',
        description: 'Total job postings created',
        value: jobsPosted.current,
        target: 5,
        unit: 'jobs',
        category: 'job',
        trend: jobsPosted.trend,
        changePercentage: jobsPosted.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(jobsPosted.current, 5),
      },
      {
        id: 'applications-received',
        name: 'Applications Received',
        description: 'Total applications received',
        value: applicationsReceived.current,
        target: 50,
        unit: 'applications',
        category: 'job',
        trend: applicationsReceived.trend,
        changePercentage: applicationsReceived.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(applicationsReceived.current, 50),
      },
      {
        id: 'candidates-hired',
        name: 'Candidates Hired',
        description: 'Total successful hires',
        value: candidatesHired.current,
        target: 3,
        unit: 'hires',
        category: 'job',
        trend: candidatesHired.trend,
        changePercentage: candidatesHired.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(candidatesHired.current, 3),
      },
      {
        id: 'time-to-hire',
        name: 'Average Time to Hire',
        description: 'Average days from posting to hire',
        value: `${timeToHire.toFixed(1)} days`,
        target: 30,
        unit: 'days',
        category: 'job',
        trend: 'stable',
        changePercentage: 0,
        lastUpdated: new Date(),
        status: this.getKPIStatus(timeToHire, 30, true), // Reverse logic for time metrics
      },
      {
        id: 'company-views',
        name: 'Company Profile Views',
        description: 'Views of company profile',
        value: companyViews.current,
        target: 100,
        unit: 'views',
        category: 'company',
        trend: companyViews.trend,
        changePercentage: companyViews.changePercentage,
        lastUpdated: new Date(),
        status: this.getKPIStatus(companyViews.current, 100),
      },
      {
        id: 'active-jobs',
        name: 'Active Job Postings',
        description: 'Currently active job postings',
        value: activeJobs,
        target: 3,
        unit: 'jobs',
        category: 'job',
        trend: 'stable',
        changePercentage: 0,
        lastUpdated: new Date(),
        status: this.getKPIStatus(activeJobs, 3),
      },
    ];

    return this.buildRoleBasedKPIs(UserRole.EMPLOYER, kpis);
  }

  // Helper methods for data fetching
  private async getTotalUsers(startDate: Date, endDate: Date) {
    const current = await this.prisma.user.count({
      where: { createdAt: { gte: startDate, lte: endDate }, deletedAt: null },
    });
    return {
      current,
      target: 1000,
      trend: 'up' as const,
      changePercentage: 12,
    };
  }

  private async getActiveUsers(startDate: Date, endDate: Date) {
    const current = await this.prisma.user.count({
      where: { lastLogin: { gte: startDate, lte: endDate }, deletedAt: null },
    });
    return { current, target: 500, trend: 'up' as const, changePercentage: 8 };
  }

  private async getTotalJobs(startDate: Date, endDate: Date) {
    const current = await this.prisma.job.count({
      where: { createdAt: { gte: startDate, lte: endDate }, deletedAt: null },
    });
    return { current, target: 100, trend: 'up' as const, changePercentage: 15 };
  }

  private async getTotalApplications(startDate: Date, endDate: Date) {
    const current = await this.prisma.jobApplication.count({
      where: { createdAt: { gte: startDate, lte: endDate }, deletedAt: null },
    });
    return { current, target: 500, trend: 'up' as const, changePercentage: 20 };
  }

  private async getSuccessfulPlacements(startDate: Date, endDate: Date) {
    const total = await this.prisma.jobApplication.count({
      where: { createdAt: { gte: startDate, lte: endDate }, deletedAt: null },
    });
    const accepted = await this.prisma.jobApplication.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: ApplicationStatus.ACCEPTED,
        deletedAt: null,
      },
    });
    const rate = total > 0 ? (accepted / total) * 100 : 0;
    return { rate, trend: 'up' as const, changePercentage: 5 };
  }

  private async getTotalEvents(startDate: Date, endDate: Date) {
    const current = await this.prisma.event.count({
      where: { createdAt: { gte: startDate, lte: endDate }, deletedAt: null },
    });
    return { current, target: 20, trend: 'up' as const, changePercentage: 10 };
  }

  private async getEventAttendance(startDate: Date, endDate: Date) {
    // Placeholder calculation - would need actual attendance tracking
    const rate = 75 + Math.random() * 15; // Mock data
    return { rate, trend: 'stable' as const, changePercentage: 2 };
  }

  private async getTotalCompanies(startDate: Date, endDate: Date) {
    const current = await this.prisma.company.count({
      where: { createdAt: { gte: startDate, lte: endDate }, deletedAt: null },
    });
    return { current, target: 50, trend: 'up' as const, changePercentage: 18 };
  }

  private async getVerifiedDocuments(startDate: Date, endDate: Date) {
    const total = await this.prisma.document.count({
      where: { createdAt: { gte: startDate, lte: endDate }, deletedAt: null },
    });
    const verified = await this.prisma.document.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        verificationStatus: VerificationStatus.APPROVED,
        deletedAt: null,
      },
    });
    const rate = total > 0 ? (verified / total) * 100 : 0;
    return { rate, trend: 'up' as const, changePercentage: 3 };
  }

  private async getPendingDocuments() {
    return await this.prisma.document.count({
      where: {
        verificationStatus: VerificationStatus.PENDING,
        deletedAt: null,
      },
    });
  }

  private async getSystemUptime() {
    // Mock system uptime - would integrate with monitoring system
    return 99.95;
  }

  private async getAverageResponseTime() {
    // Mock response time - would integrate with monitoring system
    return 150;
  }

  // Student-specific methods
  private async getUserApplications(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const current = await this.prisma.jobApplication.count({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
    });
    return { current, trend: 'up' as const, changePercentage: 25 };
  }

  private async getUserAcceptedApplications(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const total = await this.prisma.jobApplication.count({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
    });
    const accepted = await this.prisma.jobApplication.count({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
        status: ApplicationStatus.ACCEPTED,
        deletedAt: null,
      },
    });
    const rate = total > 0 ? (accepted / total) * 100 : 0;
    return { rate, trend: 'up' as const, changePercentage: 15 };
  }

  private async getUserProfileViews(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Mock data - would need profile view tracking
    const current = Math.floor(Math.random() * 100) + 20;
    return { current, trend: 'up' as const, changePercentage: 12 };
  }

  private async getUserNetworkConnections(userId: string) {
    // Mock data - would need connection tracking
    return Math.floor(Math.random() * 200) + 50;
  }

  private async getUserEventsAttended(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const current = await this.prisma.eventRegistration.count({
      where: {
        User: { some: { id: userId } },
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
    });
    return { current, trend: 'up' as const, changePercentage: 20 };
  }

  private async getUserSkillsAssessed(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { skills: true },
    });
    return user?.skills?.length || 0;
  }

  // Employer-specific methods
  private async getEmployerJobsPosted(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const current = await this.prisma.job.count({
      where: {
        postedById: userId,
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
    });
    return { current, trend: 'up' as const, changePercentage: 30 };
  }

  private async getEmployerApplicationsReceived(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const jobs = await this.prisma.job.findMany({
      where: { postedById: userId, deletedAt: null },
      select: { id: true },
    });
    const jobIds = jobs.map((job) => job.id);

    const current = await this.prisma.jobApplication.count({
      where: {
        jobId: { in: jobIds },
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
    });
    return { current, trend: 'up' as const, changePercentage: 40 };
  }

  private async getEmployerCandidatesHired(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const jobs = await this.prisma.job.findMany({
      where: { postedById: userId, deletedAt: null },
      select: { id: true },
    });
    const jobIds = jobs.map((job) => job.id);

    const current = await this.prisma.jobApplication.count({
      where: {
        jobId: { in: jobIds },
        status: ApplicationStatus.ACCEPTED,
        updatedAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
    });
    return { current, trend: 'up' as const, changePercentage: 50 };
  }

  private async getEmployerTimeToHire(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Mock calculation - would need proper time tracking
    return 25 + Math.random() * 20;
  }

  private async getEmployerCompanyViews(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Mock data - would need view tracking
    const current = Math.floor(Math.random() * 200) + 50;
    return { current, trend: 'up' as const, changePercentage: 15 };
  }

  private async getEmployerActiveJobs(userId: string) {
    return await this.prisma.job.count({
      where: {
        postedById: userId,
        status: JobStatus.ACTIVE,
        deletedAt: null,
      },
    });
  }

  // Utility methods
  private getDateRange(dateRange?: DateRange): {
    startDate: Date;
    endDate: Date;
  } {
    if (dateRange) {
      return dateRange;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return { startDate, endDate };
  }

  private getKPIStatus(
    value: number,
    target?: number,
    reverse: boolean = false,
  ): 'excellent' | 'good' | 'warning' | 'critical' {
    if (!target) return 'good';

    const percentage = (value / target) * 100;

    if (reverse) {
      // For metrics where lower is better (e.g., response time, pending items)
      if (percentage <= 50) return 'excellent';
      if (percentage <= 75) return 'good';
      if (percentage <= 100) return 'warning';
      return 'critical';
    } else {
      // For metrics where higher is better
      if (percentage >= 100) return 'excellent';
      if (percentage >= 80) return 'good';
      if (percentage >= 60) return 'warning';
      return 'critical';
    }
  }

  private buildRoleBasedKPIs(role: UserRole, kpis: KPI[]): RoleBasedKPIs {
    const summary = {
      totalKPIs: kpis.length,
      excellentKPIs: kpis.filter((kpi) => kpi.status === 'excellent').length,
      warningKPIs: kpis.filter((kpi) => kpi.status === 'warning').length,
      criticalKPIs: kpis.filter((kpi) => kpi.status === 'critical').length,
    };

    return {
      role,
      kpis,
      summary,
    };
  }
}
