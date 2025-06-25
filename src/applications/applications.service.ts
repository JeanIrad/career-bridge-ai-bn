import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { ApplicationStatus, InterviewStatus } from '@prisma/client';
import {
  NotificationType,
  NotificationPriority,
} from '../notifications/dto/notification.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  async getMyApplications(userId: string, query: any) {
    const { status, search, page = 1, limit = 10 } = query;

    const pageNum = parseInt(page.toString(), 10) || 1;
    const limitNum = parseInt(limit.toString(), 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (status) {
      where.status = status as ApplicationStatus;
    }

    if (search) {
      where.OR = [
        {
          job: {
            title: { contains: search, mode: 'insensitive' },
          },
        },
        {
          job: {
            company: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [applications, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { appliedAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              type: true,
              location: true,
              salary: true,
              status: true,
              applicationDeadline: true,
              company: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                  industry: true,
                  size: true,
                  isVerified: true,
                },
              },
            },
          },
          interviews: {
            select: {
              id: true,
              interviewType: true,
              scheduledAt: true,
              status: true,
              location: true,
              meetingLink: true,
              notes: true,
            },
            orderBy: { scheduledAt: 'desc' },
          },
        },
      }),
      this.prisma.jobApplication.count({ where }),
    ]);

    return {
      data: applications,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async getApplicationById(applicationId: string, userId: string) {
    const application = await this.prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        userId,
        deletedAt: null,
      },
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
                industry: true,
                size: true,
                isVerified: true,
                description: true,
                website: true,
                locations: true,
              },
            },
            postedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                headline: true,
              },
            },
          },
        },
        interviews: {
          orderBy: { scheduledAt: 'desc' },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async withdrawApplication(applicationId: string, userId: string) {
    const application = await this.prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        userId,
        deletedAt: null,
      },
      include: {
        job: {
          select: {
            title: true,
            company: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Can only withdraw pending applications');
    }

    // Update application status to rejected (closest equivalent to withdrawn)
    const updatedApplication = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.REJECTED,
        updatedAt: new Date(),
      },
    });

    // Send notification
    await this.notificationsService.createNotification({
      userId,
      type: NotificationType.APPLICATION_STATUS,
      title: 'Application Withdrawn',
      content: `You have withdrawn your application for ${application.job.title} at ${application.job.company.name}`,
      priority: NotificationPriority.MEDIUM,
    });

    return updatedApplication;
  }

  async getApplicationStats(userId: string) {
    const [applications, interviews] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where: { userId, deletedAt: null },
        include: {
          job: {
            select: {
              title: true,
              company: {
                select: { name: true },
              },
            },
          },
        },
      }),
      this.prisma.interview.findMany({
        where: {
          application: {
            userId,
          },
        },
      }),
    ]);

    const totalApplications = applications.length;
    const pendingApplications = applications.filter(
      (app) => app.status === ApplicationStatus.PENDING,
    ).length;
    const acceptedApplications = applications.filter(
      (app) => app.status === ApplicationStatus.SHORTLISTED,
    ).length;
    const rejectedApplications = applications.filter(
      (app) => app.status === ApplicationStatus.REJECTED,
    ).length;
    const withdrawnApplications = 0; // Not supported in current schema

    const responseRate =
      totalApplications > 0
        ? Math.round(
            ((acceptedApplications + rejectedApplications) /
              totalApplications) *
              100,
          )
        : 0;

    const interviewInvites = interviews.filter(
      (interview) => interview.status !== InterviewStatus.CANCELLED,
    ).length;

    // Get application trends for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentApplications = applications.filter(
      (app) => new Date(app.createdAt) >= thirtyDaysAgo,
    );

    // Calculate success rate (interviews / applications)
    const successRate =
      totalApplications > 0
        ? Math.round((interviewInvites / totalApplications) * 100)
        : 0;

    return {
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      withdrawnApplications,
      interviewInvites,
      responseRate,
      successRate,
      recentApplications: recentApplications.length,
      applicationsByStatus: {
        [ApplicationStatus.PENDING]: pendingApplications,
        [ApplicationStatus.SHORTLISTED]: acceptedApplications,
        [ApplicationStatus.REJECTED]: rejectedApplications,
        WITHDRAWN: withdrawnApplications,
      },
      monthlyTrend: {
        applications: recentApplications.length,
        period: '30 days',
      },
    };
  }

  async getApplicationTimeline(applicationId: string, userId: string) {
    const application = await this.prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        userId,
        deletedAt: null,
      },
      include: {
        interviews: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Build timeline events
    const timeline = [
      {
        type: 'application_submitted',
        date: application.appliedAt,
        title: 'Application Submitted',
        description: 'Your application has been successfully submitted',
        status: 'completed',
      },
    ];

    // Add status change events
    if (application.status === ApplicationStatus.SHORTLISTED) {
      timeline.push({
        type: 'application_reviewed',
        date: application.updatedAt,
        title: 'Application Shortlisted',
        description: 'Your application has been shortlisted for review',
        status: 'completed',
      });
    } else if (application.status === ApplicationStatus.REJECTED) {
      timeline.push({
        type: 'application_rejected',
        date: application.updatedAt,
        title: 'Application Rejected',
        description: 'Unfortunately, your application was not successful',
        status: 'rejected',
      });
    }

    // Add interview events
    application.interviews.forEach((interview) => {
      timeline.push({
        type: 'interview_scheduled',
        date: interview.scheduledAt,
        title: `${interview.interviewType} Interview`,
        description: `Interview scheduled for ${interview.scheduledAt.toLocaleDateString()}`,
        status: interview.status.toLowerCase(),
      });
    });

    // Sort timeline by date
    timeline.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return {
      applicationId,
      timeline,
      currentStatus: application.status,
    };
  }

  async getUpcomingInterviews(userId: string) {
    const now = new Date();
    const upcomingInterviews = await this.prisma.interview.findMany({
      where: {
        application: {
          userId,
        },
        scheduledAt: {
          gte: now,
        },
        status: {
          in: [InterviewStatus.SCHEDULED],
        },
      },
      include: {
        application: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                company: {
                  select: {
                    name: true,
                    logo: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return upcomingInterviews;
  }

  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    userId: string,
    message?: string,
  ) {
    const application = await this.prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        userId,
        deletedAt: null,
      },
      include: {
        job: {
          select: {
            title: true,
            company: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const updatedApplication = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Send notification based on status
    let notificationTitle = 'Application Status Updated';
    let notificationContent = `Your application status has been updated to ${status}`;

    switch (status) {
      case ApplicationStatus.SHORTLISTED:
        notificationTitle = 'Application Shortlisted!';
        notificationContent = `Great news! Your application for ${application.job.title} at ${application.job.company.name} has been shortlisted.`;
        break;
      case ApplicationStatus.REJECTED:
        notificationTitle = 'Application Update';
        notificationContent = `Your application for ${application.job.title} at ${application.job.company.name} was not successful this time.`;
        break;
    }

    await this.notificationsService.createNotification({
      userId,
      type: NotificationType.APPLICATION_STATUS,
      title: notificationTitle,
      content: notificationContent,
      priority: NotificationPriority.HIGH,
    });

    return updatedApplication;
  }
}
