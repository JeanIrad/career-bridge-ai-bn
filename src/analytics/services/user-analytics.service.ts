import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRole, ApplicationStatus } from '@prisma/client';
import { AnalyticsFilter, DateRange } from './analytics.service';

export interface UserAnalytics {
  userId: string;
  role: UserRole;
  registrationDate: Date;
  lastLogin: Date | null;
  profileCompleteness: number;
  activityScore: number;
  engagementLevel: 'high' | 'medium' | 'low';
  metrics: UserMetrics;
}

export interface UserMetrics {
  totalLogins: number;
  averageSessionDuration: number;
  profileViews: number;
  applicationsSubmitted: number;
  applicationsAccepted: number;
  eventsAttended: number;
  networkConnections: number;
  skillsCompleted: number;
}

@Injectable()
export class UserAnalyticsService {
  private readonly logger = new Logger(UserAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get comprehensive user analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobApplications: {
          where: { deletedAt: null },
        },
        userSessions: {
          where: { isActive: true },
          orderBy: { lastActivity: 'desc' },
          take: 10,
        },
        skills: true,
        education: true,
        experiences: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const profileCompleteness = this.calculateProfileCompleteness(user);
    const activityScore = await this.calculateActivityScore(userId);
    const engagementLevel = this.determineEngagementLevel(activityScore);

    const metrics: UserMetrics = {
      totalLogins: user.userSessions.length,
      averageSessionDuration: this.calculateAverageSessionDuration(
        user.userSessions,
      ),
      profileViews: Math.floor(Math.random() * 100), // Mock data
      applicationsSubmitted: user.jobApplications.length,
      applicationsAccepted: user.jobApplications.filter(
        (app) => app.status === ApplicationStatus.ACCEPTED,
      ).length,
      eventsAttended: Math.floor(Math.random() * 10), // Mock data
      networkConnections: Math.floor(Math.random() * 50), // Mock data
      skillsCompleted: user.skills.length,
    };

    return {
      userId,
      role: user.role,
      registrationDate: user.createdAt,
      lastLogin: user.lastLogin,
      profileCompleteness,
      activityScore,
      engagementLevel,
      metrics,
    };
  }

  // Helper methods
  private calculateProfileCompleteness(user: any): number {
    let score = 0;
    const totalFields = 10;

    if (user.firstName) score++;
    if (user.lastName) score++;
    if (user.bio) score++;
    if (user.headline) score++;
    if (user.avatar) score++;
    if (user.resume) score++;
    if (user.education?.length > 0) score++;
    if (user.experiences?.length > 0) score++;
    if (user.skills?.length > 0) score++;
    if (user.socialLinks) score++;

    return Math.round((score / totalFields) * 100);
  }

  private async calculateActivityScore(userId: string): Promise<number> {
    // Mock calculation - would be based on actual user activities
    return Math.floor(Math.random() * 100);
  }

  private determineEngagementLevel(
    activityScore: number,
  ): 'high' | 'medium' | 'low' {
    if (activityScore >= 70) return 'high';
    if (activityScore >= 40) return 'medium';
    return 'low';
  }

  private calculateAverageSessionDuration(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const durations = sessions.map((session) => {
      const duration =
        session.lastActivity.getTime() - session.createdAt.getTime();
      return duration / (1000 * 60); // Convert to minutes
    });

    return Math.round(
      durations.reduce((sum, duration) => sum + duration, 0) / durations.length,
    );
  }
}
