import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  UserRole,
  ApplicationStatus,
  JobStatus,
  EventStatus,
} from '@prisma/client';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsFilter {
  dateRange?: DateRange;
  userRole?: UserRole;
  status?: string;
  department?: string;
  location?: string;
}

export interface MetricData {
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get platform overview statistics
   */
  async getPlatformOverview(filter?: AnalyticsFilter): Promise<{
    totalUsers: MetricData;
    activeUsers: MetricData;
    totalJobs: MetricData;
    totalApplications: MetricData;
    totalEvents: MetricData;
    totalCompanies: MetricData;
  }> {
    const { startDate, endDate } = this.getDateRange(filter?.dateRange);

    // Get current period data
    const [
      totalUsers,
      activeUsers,
      totalJobs,
      totalApplications,
      totalEvents,
      totalCompanies,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
      this.prisma.user.count({
        where: {
          lastLogin: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
      this.prisma.job.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
      this.prisma.jobApplication.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
      this.prisma.event.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
      this.prisma.company.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
    ]);

    // Get previous period data for comparison
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);
    const [
      prevTotalUsers,
      prevActiveUsers,
      prevTotalJobs,
      prevTotalApplications,
      prevTotalEvents,
      prevTotalCompanies,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: previousPeriod.startDate,
            lte: previousPeriod.endDate,
          },
          deletedAt: null,
        },
      }),
      this.prisma.user.count({
        where: {
          lastLogin: {
            gte: previousPeriod.startDate,
            lte: previousPeriod.endDate,
          },
          deletedAt: null,
        },
      }),
      this.prisma.job.count({
        where: {
          createdAt: {
            gte: previousPeriod.startDate,
            lte: previousPeriod.endDate,
          },
          deletedAt: null,
        },
      }),
      this.prisma.jobApplication.count({
        where: {
          createdAt: {
            gte: previousPeriod.startDate,
            lte: previousPeriod.endDate,
          },
          deletedAt: null,
        },
      }),
      this.prisma.event.count({
        where: {
          createdAt: {
            gte: previousPeriod.startDate,
            lte: previousPeriod.endDate,
          },
          deletedAt: null,
        },
      }),
      this.prisma.company.count({
        where: {
          createdAt: {
            gte: previousPeriod.startDate,
            lte: previousPeriod.endDate,
          },
          deletedAt: null,
        },
      }),
    ]);

    return {
      totalUsers: this.calculateMetricChange(
        'Total Users',
        totalUsers,
        prevTotalUsers,
      ),
      activeUsers: this.calculateMetricChange(
        'Active Users',
        activeUsers,
        prevActiveUsers,
      ),
      totalJobs: this.calculateMetricChange(
        'Total Jobs',
        totalJobs,
        prevTotalJobs,
      ),
      totalApplications: this.calculateMetricChange(
        'Total Applications',
        totalApplications,
        prevTotalApplications,
      ),
      totalEvents: this.calculateMetricChange(
        'Total Events',
        totalEvents,
        prevTotalEvents,
      ),
      totalCompanies: this.calculateMetricChange(
        'Total Companies',
        totalCompanies,
        prevTotalCompanies,
      ),
    };
  }

  /**
   * Get user growth data over time
   */
  async getUserGrowthData(filter?: AnalyticsFilter): Promise<TimeSeriesData[]> {
    const { startDate, endDate } = this.getDateRange(filter?.dateRange);

    const userGrowth = await this.prisma.$queryRaw<
      {
        date: string;
        count: bigint;
      }[]
    >`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "User" 
      WHERE "createdAt" >= ${startDate} 
        AND "createdAt" <= ${endDate}
        AND "deletedAt" IS NULL
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    return userGrowth.map((item) => ({
      date: item.date,
      value: Number(item.count),
    }));
  }

  /**
   * Get application success rates
   */
  async getApplicationSuccessRates(filter?: AnalyticsFilter): Promise<{
    totalApplications: number;
    acceptedApplications: number;
    rejectedApplications: number;
    pendingApplications: number;
    successRate: number;
  }> {
    const { startDate, endDate } = this.getDateRange(filter?.dateRange);

    const applications = await this.prisma.jobApplication.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      _count: {
        status: true,
      },
    });

    const stats = {
      totalApplications: 0,
      acceptedApplications: 0,
      rejectedApplications: 0,
      pendingApplications: 0,
      successRate: 0,
    };

    applications.forEach((app) => {
      stats.totalApplications += app._count.status;
      switch (app.status) {
        case ApplicationStatus.ACCEPTED:
          stats.acceptedApplications = app._count.status;
          break;
        case ApplicationStatus.REJECTED:
          stats.rejectedApplications = app._count.status;
          break;
        case ApplicationStatus.PENDING:
          stats.pendingApplications = app._count.status;
          break;
      }
    });

    stats.successRate =
      stats.totalApplications > 0
        ? (stats.acceptedApplications / stats.totalApplications) * 100
        : 0;

    return stats;
  }

  /**
   * Get top performing companies
   */
  async getTopCompanies(
    limit: number = 10,
    filter?: AnalyticsFilter,
  ): Promise<
    {
      id: string;
      name: string;
      jobsPosted: number;
      applicationsReceived: number;
      successfulHires: number;
      averageTimeToHire: number;
    }[]
  > {
    const { startDate, endDate } = this.getDateRange(filter?.dateRange);

    const companies = await this.prisma.company.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        jobs: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
            deletedAt: null,
          },
          select: {
            id: true,
            applications: {
              where: {
                createdAt: { gte: startDate, lte: endDate },
                deletedAt: null,
              },
              select: {
                status: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
      take: limit,
    });

    return companies.map((company) => {
      const jobsPosted = company.jobs.length;
      const allApplications = company.jobs.flatMap((job) => job.applications);
      const applicationsReceived = allApplications.length;
      const successfulHires = allApplications.filter(
        (app) => app.status === ApplicationStatus.ACCEPTED,
      ).length;

      // Calculate average time to hire (in days)
      const hiredApplications = allApplications.filter(
        (app) => app.status === ApplicationStatus.ACCEPTED,
      );
      const averageTimeToHire =
        hiredApplications.length > 0
          ? hiredApplications.reduce((sum, app) => {
              const timeDiff =
                app.updatedAt.getTime() - app.createdAt.getTime();
              return sum + timeDiff / (1000 * 60 * 60 * 24); // Convert to days
            }, 0) / hiredApplications.length
          : 0;

      return {
        id: company.id,
        name: company.name,
        jobsPosted,
        applicationsReceived,
        successfulHires,
        averageTimeToHire: Math.round(averageTimeToHire * 100) / 100,
      };
    });
  }

  /**
   * Get skill demand analysis
   */
  async getSkillDemandAnalysis(filter?: AnalyticsFilter): Promise<
    {
      skill: string;
      demand: number;
      growth: number;
      averageSalary?: number;
    }[]
  > {
    const { startDate, endDate } = this.getDateRange(filter?.dateRange);

    // Get skills from job postings
    const jobs = await this.prisma.job.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      select: {
        requirements: true,
        salary: true,
      },
    });

    // Extract skills from job requirements (assuming they're stored as JSON or comma-separated)
    const skillMap = new Map<string, { count: number; salaries: number[] }>();

    jobs.forEach((job) => {
      let skills: string[] = [];

      // Parse skills from requirements (assuming array format)
      try {
        if (Array.isArray(job.requirements)) {
          skills = job.requirements.map((req) => req.toString());
        } else if (typeof job.requirements === 'string') {
          // Try to extract skills from text
          const commonSkills = [
            'JavaScript',
            'Python',
            'Java',
            'React',
            'Node.js',
            'SQL',
            'AWS',
            'Docker',
          ];
          skills = commonSkills.filter((skill) =>
            job.requirements
              .toString()
              .toLowerCase()
              .includes(skill.toLowerCase()),
          );
        }
      } catch (error) {
        // If parsing fails, skip this job
      }

      skills.forEach((skill) => {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, { count: 0, salaries: [] });
        }
        const skillData = skillMap.get(skill)!;
        skillData.count++;

        // Add salary data if available
        if (
          job.salary &&
          typeof job.salary === 'object' &&
          job.salary !== null
        ) {
          const salaryData = job.salary as any;
          if (salaryData.min && salaryData.max) {
            skillData.salaries.push((salaryData.min + salaryData.max) / 2);
          }
        }
      });
    });

    // Convert to array and calculate averages
    return Array.from(skillMap.entries())
      .map(([skill, data]) => ({
        skill,
        demand: data.count,
        growth: Math.random() * 20 - 10, // Placeholder for growth calculation
        averageSalary:
          data.salaries.length > 0
            ? data.salaries.reduce((sum, salary) => sum + salary, 0) /
              data.salaries.length
            : undefined,
      }))
      .sort((a, b) => b.demand - a.demand);
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(filter?: AnalyticsFilter): Promise<{
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
    bounceRate: number;
    retentionRate: number;
  }> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dailyActiveUsers, weeklyActiveUsers, monthlyActiveUsers] =
      await Promise.all([
        this.prisma.user.count({
          where: {
            lastLogin: { gte: oneDayAgo },
            deletedAt: null,
          },
        }),
        this.prisma.user.count({
          where: {
            lastLogin: { gte: oneWeekAgo },
            deletedAt: null,
          },
        }),
        this.prisma.user.count({
          where: {
            lastLogin: { gte: oneMonthAgo },
            deletedAt: null,
          },
        }),
      ]);

    // Get session data for more detailed metrics
    const sessions = await this.prisma.userSession.findMany({
      where: {
        createdAt: { gte: oneMonthAgo },
        isActive: true,
      },
      select: {
        createdAt: true,
        lastActivity: true,
      },
    });

    // Calculate average session duration
    const sessionDurations = sessions.map((session) => {
      const duration =
        session.lastActivity.getTime() - session.createdAt.getTime();
      return duration / (1000 * 60); // Convert to minutes
    });

    const averageSessionDuration =
      sessionDurations.length > 0
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) /
          sessionDurations.length
        : 0;

    return {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      averageSessionDuration: Math.round(averageSessionDuration * 100) / 100,
      bounceRate: Math.random() * 30 + 10, // Placeholder
      retentionRate: Math.random() * 20 + 70, // Placeholder
    };
  }

  // Helper methods
  private getDateRange(dateRange?: DateRange): {
    startDate: Date;
    endDate: Date;
  } {
    if (dateRange) {
      return dateRange;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Default to last 30 days

    return { startDate, endDate };
  }

  private getPreviousPeriod(
    startDate: Date,
    endDate: Date,
  ): { startDate: Date; endDate: Date } {
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(
      previousEndDate.getTime() - periodLength,
    );

    return {
      startDate: previousStartDate,
      endDate: previousEndDate,
    };
  }

  private calculateMetricChange(
    label: string,
    current: number,
    previous: number,
  ): MetricData {
    const change = current - previous;
    const percentage = previous > 0 ? (change / previous) * 100 : 0;

    return {
      label,
      value: current,
      change,
      changeType: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral',
      percentage: Math.round(percentage * 100) / 100,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    };
  }
}
