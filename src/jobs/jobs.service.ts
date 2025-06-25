import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Job,
  JobApplication,
  User,
  Prisma,
  ApplicationStatus,
  InterviewType,
  InterviewStatus,
  JobStatus,
} from '@prisma/client';
import {
  CreateJobDto,
  UpdateJobDto,
  JobQueryDto,
  JobStatsDto,
} from './dto/job.dto';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationPriority,
} from '../notifications/dto/notification.dto';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private notificationsService: NotificationsService,
  ) {
    // this.getUserJobStats('b4d97c5e-9841-4ecf-b454-049df5cc0652').then((res) => {
    //   console.log('Saved Jobs========>', res);
    // });
  }

  // ============= EMPLOYER OPERATIONS =============

  async createJob(employerId: string, createJobDto: CreateJobDto) {
    // Get employer's company
    const employer = await this.prisma.user.findUnique({
      where: { id: employerId },
      include: { companies: true },
    });

    if (!employer || !employer.companies.length) {
      throw new Error('Employer must have a company to post jobs');
    }

    const company = employer.companies[0]; // Use first company

    return this.prisma.job.create({
      data: {
        title: createJobDto.title,
        description: createJobDto.description,
        requirements: createJobDto.requirements,
        type: createJobDto.type,
        location: createJobDto.location,
        salary: createJobDto.salary as any,
        applicationDeadline: new Date(createJobDto.applicationDeadline),
        status: createJobDto.status || JobStatus.ACTIVE,
        companyId: company.id,
        postedById: employerId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            industry: true,
            size: true,
          },
        },
        postedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
  }

  async getEmployerJobs(employerId: string, query: JobQueryDto) {
    const { status, search, page = 1, limit = 10 } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.JobWhereInput = {
      postedById: employerId,
      deletedAt: null,
    };

    if (status) {
      where.status = status as JobStatus;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              industry: true,
              size: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEmployerJobStats(employerId: string, period: string = '30d') {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const jobs = await this.prisma.job.findMany({
      where: {
        postedById: employerId,
        deletedAt: null,
      },
      include: {
        applications: {
          where: {
            createdAt: { gte: startDate },
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(
      (job) => job.status === JobStatus.ACTIVE,
    ).length;
    const totalApplications = jobs.reduce(
      (sum, job) => sum + job._count.applications,
      0,
    );
    const recentApplications = jobs.reduce(
      (sum, job) => sum + job.applications.length,
      0,
    );

    // Calculate application trends
    const applicationTrends = await this.getApplicationTrends(employerId, days);

    // Get top performing jobs
    const topJobs = jobs
      .sort((a, b) => b._count.applications - a._count.applications)
      .slice(0, 5)
      .map((job) => ({
        id: job.id,
        title: job.title,
        applications: job._count.applications,
        status: job.status,
      }));

    return {
      overview: {
        totalJobs,
        activeJobs,
        totalApplications,
        recentApplications,
        averageApplicationsPerJob:
          totalJobs > 0 ? Math.round(totalApplications / totalJobs) : 0,
      },
      trends: applicationTrends,
      topJobs,
      period,
    };
  }

  async updateJob(
    jobId: string,
    employerId: string,
    updateJobDto: UpdateJobDto,
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.postedById !== employerId) {
      throw new ForbiddenException('Not authorized to update this job');
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        title: updateJobDto.title,
        description: updateJobDto.description,
        requirements: updateJobDto.requirements,
        type: updateJobDto.type,
        location: updateJobDto.location,
        salary: updateJobDto.salary as any,
        status: updateJobDto.status,
        applicationDeadline: updateJobDto.applicationDeadline
          ? new Date(updateJobDto.applicationDeadline)
          : undefined,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            industry: true,
            size: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
  }

  async updateJobStatus(jobId: string, employerId: string, status: JobStatus) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.postedById !== employerId) {
      throw new ForbiddenException('Not authorized to update this job');
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: { status },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            industry: true,
            size: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
  }

  async deleteJob(jobId: string, employerId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.postedById !== employerId) {
      throw new ForbiddenException('Not authorized to delete this job');
    }

    // Soft delete
    return this.prisma.job.update({
      where: { id: jobId },
      data: { deletedAt: new Date() },
    });
  }

  // ============= PUBLIC OPERATIONS =============

  async getAllJobs(query: JobQueryDto, userId?: string) {
    const { search, location, type, company, page = 1, limit = 10 } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.JobWhereInput = {
      status: JobStatus.ACTIVE,
      deletedAt: null,
      applicationDeadline: { gte: new Date() },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { requirements: { hasSome: [search] } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (type) {
      where.type = { contains: type, mode: 'insensitive' };
    }

    if (company) {
      where.company = {
        name: { contains: company, mode: 'insensitive' },
      };
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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
          postedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
          ...(userId && {
            applications: {
              where: { userId },
              select: { id: true, status: true },
            },
            savedByUsers: {
              where: { userId },
              select: { id: true },
            },
          }),
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    // Add application and saved status for current user
    const jobsWithApplicationStatus = jobs.map((job) => {
      const jobAny = job as any;

      return {
        ...job,
        hasApplied: userId
          ? jobAny.applications && jobAny.applications.length > 0
          : false,
        applicationStatus:
          userId && jobAny.applications && jobAny.applications.length > 0
            ? jobAny.applications[0].status
            : null,
        isSaved: userId
          ? jobAny.savedByUsers && jobAny.savedByUsers.length > 0
          : false,
      };
    });

    return {
      data: jobsWithApplicationStatus,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getJobById(jobId: string, userId?: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId, deletedAt: null },
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
        _count: {
          select: {
            applications: true,
          },
        },
        applications: userId
          ? {
              where: { userId },
              select: { id: true, status: true, appliedAt: true },
            }
          : false,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return {
      ...job,
      hasApplied: userId
        ? job.applications && job.applications.length > 0
        : false,
      applicationStatus:
        userId && job.applications && job.applications.length > 0
          ? job.applications[0].status
          : null,
    };
  }

  // ============= APPLICATION OPERATIONS =============

  async getAllEmployerApplications(employerId: string, query: any) {
    const { status, search, page = 1, limit = 10 } = query;

    // Ensure page and limit are numbers
    const pageNum = parseInt(page.toString(), 10) || 1;
    const limitNum = parseInt(limit.toString(), 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Get all jobs for this employer
    const employerJobs = await this.prisma.job.findMany({
      where: { postedById: employerId, deletedAt: null },
      select: { id: true },
    });

    const jobIds = employerJobs.map((job) => job.id);

    if (jobIds.length === 0) {
      return {
        data: [],
        pagination: {
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
        },
      };
    }

    const where: Prisma.JobApplicationWhereInput = {
      jobId: { in: jobIds },
      deletedAt: null,
    };

    if (status) {
      where.status = status as ApplicationStatus;
    }

    if (search) {
      where.OR = [
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { university: { contains: search, mode: 'insensitive' } },
              { major: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          job: {
            title: { contains: search, mode: 'insensitive' },
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
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              avatar: true,
              university: true,
              major: true,
              graduationYear: true,
              gpa: true,
              headline: true,
              bio: true,
              city: true,
              state: true,
              country: true,
              skills: {
                select: {
                  id: true,
                  name: true,
                  endorsements: true,
                },
              },
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              type: true,
              location: true,
            },
          },
          interviews: {
            select: {
              id: true,
              interviewType: true,
              scheduledAt: true,
              status: true,
            },
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

  async applyToJob(
    jobId: string,
    userId: string,
    applicationData: { resumeUrl: string; coverLetter?: string },
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId, deletedAt: null },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== JobStatus.ACTIVE) {
      throw new Error('Job is not active');
    }

    if (job.applicationDeadline < new Date()) {
      throw new Error('Application deadline has passed');
    }

    // Check if user already applied
    const existingApplication = await this.prisma.jobApplication.findFirst({
      where: { jobId, userId },
    });

    if (existingApplication) {
      throw new Error('You have already applied to this job');
    }

    return this.prisma.jobApplication.create({
      data: {
        jobId,
        userId,
        resumeUrl: applicationData.resumeUrl,
        coverLetter: applicationData.coverLetter,
        status: ApplicationStatus.PENDING,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getJobApplications(jobId: string, employerId: string, query: any) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.postedById !== employerId) {
      throw new ForbiddenException(
        'Not authorized to view applications for this job',
      );
    }

    const { status, page = 1, limit = 10 } = query;

    // Ensure page and limit are numbers
    const pageNum = parseInt(page.toString(), 10) || 1;
    const limitNum = parseInt(limit.toString(), 10) || 10;

    const skip = (pageNum - 1) * limitNum;
    const where: Prisma.JobApplicationWhereInput = {
      jobId,
      deletedAt: null,
    };

    if (status) {
      where.status = status as ApplicationStatus;
    }

    const [applications, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { appliedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              university: true,
              major: true,
              graduationYear: true,
              gpa: true,
              headline: true,
              skills: {
                select: {
                  id: true,
                  name: true,
                  endorsements: true,
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
            },
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

  async getJobStats(jobId: string, employerId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.postedById !== employerId) {
      throw new ForbiddenException(
        'Not authorized to view statistics for this job',
      );
    }

    const applications = await this.prisma.jobApplication.findMany({
      where: { jobId, deletedAt: null },
      include: {
        user: {
          select: {
            university: true,
            major: true,
            graduationYear: true,
            skills: {
              select: {
                id: true,
                name: true,
                endorsements: true,
              },
            },
          },
        },
        interviews: true,
      },
    });

    const totalApplications = applications.length;
    const applicationsByStatus = applications.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalInterviews = applications.reduce(
      (sum, app) => sum + app.interviews.length,
      0,
    );

    // University distribution
    const universityStats = applications.reduce(
      (acc, app) => {
        const university = app.user.university || 'Unknown';
        acc[university] = (acc[university] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Skills distribution
    const skillsStats = applications.reduce(
      (acc, app) => {
        app.user.skills.forEach((skill) => {
          acc[skill.name] = (acc[skill.name] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      overview: {
        totalApplications,
        totalInterviews,
        conversionRate:
          totalApplications > 0
            ? ((totalInterviews / totalApplications) * 100).toFixed(2)
            : 0,
      },
      applicationsByStatus,
      topUniversities: Object.entries(universityStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([university, count]) => ({ university, count })),
      topSkills: Object.entries(skillsStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count })),
    };
  }

  // ============= HELPER METHODS =============

  private parsePeriod(period: string): number {
    switch (period) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      default:
        return 30;
    }
  }

  private async getApplicationTrends(employerId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const applications = await this.prisma.jobApplication.findMany({
      where: {
        job: {
          postedById: employerId,
        },
        appliedAt: { gte: startDate },
      },
      select: {
        appliedAt: true,
      },
    });

    // Group by date
    const trends = applications.reduce(
      (acc, app) => {
        const date = app.appliedAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Fill missing dates with 0
    const result: Array<{ date: string; applications: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        applications: trends[dateStr] || 0,
      });
    }

    return result;
  }

  private formatSalary(salary: any): string {
    if (!salary?.min || !salary?.max) return 'Salary not specified';

    const currency = salary.currency || 'USD';
    const period = salary.period || 'yearly';

    return `${currency} ${salary.min.toLocaleString()}-${salary.max.toLocaleString()} ${period}`;
  }

  // ============= APPLICATION MANAGEMENT =============

  async updateApplicationStatus(
    jobId: string,
    applicationId: string,
    status: string,
    employerId: string,
    message?: string,
  ) {
    // Verify job belongs to employer
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, postedById: employerId },
      include: {
        company: true,
        postedBy: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found or access denied');
    }

    // Get application with user details
    const application = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, jobId },
      include: {
        user: true,
        job: {
          include: {
            company: true,
            postedBy: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Update application status
    const updatedApplication = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: status as any },
      include: {
        user: true,
        job: {
          include: {
            company: true,
            postedBy: true,
          },
        },
      },
    });

    // Send email notification
    await this.sendApplicationStatusEmail(updatedApplication, message);

    return {
      success: true,
      message: 'Application status updated successfully',
      application: updatedApplication,
    };
  }

  async shortlistCandidate(
    jobId: string,
    applicationId: string,
    employerId: string,
    message?: string,
  ) {
    const result = await this.updateApplicationStatus(
      jobId,
      applicationId,
      'SHORTLISTED',
      employerId,
      message,
    );

    // Create notification
    const application = result.application;
    await this.notificationsService.createNotification({
      userId: application.userId,
      title: "🎉 You've been shortlisted!",
      content: `Great news! You've been shortlisted for the ${application.job.title} position at ${application.job.company.name}.`,
      type: NotificationType.JOB_ALERT,
      priority: NotificationPriority.HIGH,
      link: `/student/applications/${application.id}`,
      sendEmail: true,
    });

    return {
      ...result,
      message: 'Candidate shortlisted successfully',
    };
  }

  async rejectApplication(
    jobId: string,
    applicationId: string,
    employerId: string,
    reason?: string,
  ) {
    const result = await this.updateApplicationStatus(
      jobId,
      applicationId,
      'REJECTED',
      employerId,
      reason,
    );

    // Create notification
    const application = result.application;
    await this.notificationsService.createNotification({
      userId: application.userId,
      title: 'Application Update',
      content: `Thank you for your interest in the ${application.job.title} position at ${application.job.company.name}. We've decided to move forward with other candidates. We encourage you to apply for future opportunities.`,
      type: NotificationType.JOB_ALERT,
      priority: NotificationPriority.MEDIUM,
      link: `/student/applications/${application.id}`,
      sendEmail: true,
    });

    return {
      ...result,
      message: 'Application rejected successfully',
    };
  }

  async scheduleInterview(
    jobId: string,
    applicationId: string,
    employerId: string,
    interviewData: {
      scheduledDate: string;
      scheduledTime: string;
      interviewType: 'PHONE' | 'VIDEO' | 'IN_PERSON';
      location?: string;
      meetingLink?: string;
      notes?: string;
    },
  ) {
    // Verify job belongs to employer
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, postedById: employerId },
      include: {
        company: true,
        postedBy: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found or access denied');
    }

    // Get application
    const application = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, jobId },
      include: {
        user: true,
        job: {
          include: {
            company: true,
            postedBy: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Create interview record with proper date handling
    const scheduledDateTime = new Date(
      `${interviewData.scheduledDate}T${interviewData.scheduledTime}`,
    );

    const interview = await this.prisma.interview.create({
      data: {
        applicationId,
        scheduledAt: scheduledDateTime,
        interviewType: interviewData.interviewType as InterviewType,
        location: interviewData.location,
        meetingLink: interviewData.meetingLink,
        notes: interviewData.notes,
        status: InterviewStatus.SCHEDULED,
      },
    });

    // Update application status to INTERVIEWED
    await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.INTERVIEWED },
    });

    // Send interview email
    await this.sendInterviewScheduledEmail(
      application,
      interview,
      interviewData,
    );

    // Create notification
    await this.notificationsService.createNotification({
      userId: application.userId,
      title: '📅 Interview Scheduled!',
      content: `Your interview for the ${application.job.title} position at ${application.job.company.name} has been scheduled for ${interviewData.scheduledDate} at ${interviewData.scheduledTime}.`,
      type: NotificationType.EVENT_REMINDER,
      priority: NotificationPriority.HIGH,
      link: `/student/interviews/${interview.id}`,
      sendEmail: true,
    });

    return {
      success: true,
      message: 'Interview scheduled successfully',
      interview,
    };
  }

  async messageCandidate(
    jobId: string,
    applicationId: string,
    employerId: string,
    subject: string,
    message: string,
  ) {
    // Verify job belongs to employer
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, postedById: employerId },
      include: {
        company: true,
        postedBy: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found or access denied');
    }

    // Get application
    const application = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, jobId },
      include: {
        user: true,
        job: {
          include: {
            company: true,
            postedBy: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Send message email
    await this.sendCandidateMessageEmail(application, subject, message);

    // Create notification
    await this.notificationsService.createNotification({
      userId: application.userId,
      title: `💬 Message from ${application.job.company.name}`,
      content: `You have received a new message regarding your application for ${application.job.title}.`,
      type: NotificationType.MESSAGE,
      priority: NotificationPriority.MEDIUM,
      link: `/student/messages`,
      sendEmail: true,
    });

    return {
      success: true,
      message: 'Message sent successfully',
    };
  }

  // ============= EMAIL HELPERS =============

  private async sendApplicationStatusEmail(application: any, message?: string) {
    const candidate = application.user;
    const job = application.job;
    const company = job.company;

    let emailSubject = '';
    let emailContent = '';

    switch (application.status) {
      case 'SHORTLISTED':
        emailSubject = `🎉 You've been shortlisted for ${job.title} at ${company.name}!`;
        emailContent = `Congratulations! We're excited to inform you that you've been shortlisted for the ${job.title} position. We were impressed with your application and would like to move forward with the next steps.`;
        break;
      case 'REJECTED':
        emailSubject = `Application Update - ${job.title} at ${company.name}`;
        emailContent = `Thank you for your interest in the ${job.title} position. After careful consideration, we've decided to move forward with other candidates. We encourage you to apply for future opportunities.`;
        break;
      case 'REVIEWED':
        emailSubject = `Application Reviewed - ${job.title} at ${company.name}`;
        emailContent = `Thank you for your application for the ${job.title} position. We've reviewed your application and will be in touch soon with next steps.`;
        break;
      default:
        emailSubject = `Application Update - ${job.title} at ${company.name}`;
        emailContent = `We wanted to update you on the status of your application for the ${job.title} position.`;
    }

    await this.mailService.sendCustomEmail(
      candidate.email,
      emailSubject,
      'application-status-update',
      {
        candidateName: candidate.firstName,
        jobTitle: job.title,
        companyName: company.name,
        status: application.status,
        content: emailContent,
        message: message || '',
        applicationUrl: `${process.env.FRONTEND_URL}/student/applications/${application.id}`,
      },
    );
  }

  private async sendInterviewScheduledEmail(
    application: any,
    interview: any,
    interviewData: any,
  ) {
    const candidate = application.user;
    const job = application.job;
    const company = job.company;
    const employer = job.postedBy;

    await this.mailService.sendCustomEmail(
      candidate.email,
      `Interview Scheduled - ${job.title} at ${company.name}`,
      'interview-scheduled',
      {
        candidateName: candidate.firstName,
        jobTitle: job.title,
        companyName: company.name,
        interviewDate: interviewData.scheduledDate,
        interviewTime: interviewData.scheduledTime,
        interviewType: interviewData.interviewType,
        location: interviewData.location || '',
        meetingLink: interviewData.meetingLink || '',
        notes: interviewData.notes || '',
        contactEmail: employer.email,
      },
    );
  }

  private async sendCandidateMessageEmail(
    application: any,
    subject: string,
    message: string,
  ) {
    const candidate = application.user;
    const job = application.job;
    const company = job.company;
    const employer = job.postedBy;

    await this.mailService.sendCustomEmail(
      candidate.email,
      `Message from ${company.name} - ${subject}`,
      'candidate-message',
      {
        candidateName: candidate.firstName,
        jobTitle: job.title,
        companyName: company.name,
        employerName: `${employer.firstName} ${employer.lastName}`,
        subject: subject,
        message: message,
        replyEmail: employer.email,
      },
    );
  }

  // ============= STUDENT/ALUMNI OPERATIONS =============

  async saveJob(jobId: string, userId: string | any) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = typeof userId === 'string' ? userId : userId?.id;

    // Check if job exists
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check if already saved
    const existingSave = await this.prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: actualUserId,
          jobId,
        },
      },
    });

    if (existingSave) {
      throw new BadRequestException('Job is already saved');
    }

    // Save the job
    const savedJob = await this.prisma.savedJob.create({
      data: {
        userId: actualUserId,
        jobId,
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
              },
            },
            _count: {
              select: {
                applications: true,
              },
            },
          },
        },
      },
    });

    // Send notification
    await this.notificationsService.createNotification({
      userId: actualUserId,
      type: NotificationType.SYSTEM,
      title: 'Job Saved',
      content: `You saved the job: ${job.title}`,
      priority: NotificationPriority.LOW,
    });

    return savedJob;
  }

  async unsaveJob(jobId: string, userId: string | any) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = typeof userId === 'string' ? userId : userId?.id;

    // Check if the save exists
    const savedJob = await this.prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: actualUserId,
          jobId,
        },
      },
    });

    if (!savedJob) {
      throw new NotFoundException('Saved job not found');
    }

    // Remove the save
    await this.prisma.savedJob.delete({
      where: {
        userId_jobId: {
          userId: actualUserId,
          jobId,
        },
      },
    });

    return { message: 'Job unsaved successfully' };
  }

  async getSavedJobs(userId: string | any) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = typeof userId === 'string' ? userId : userId?.id;

    const savedJobs = await this.prisma.savedJob.findMany({
      where: { userId: actualUserId },
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
              },
            },
            _count: {
              select: {
                applications: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log('Saved Jobs========>', savedJobs);
    return savedJobs.map((savedJob) => ({
      ...savedJob.job,
      savedAt: savedJob.createdAt,
      saved: true,
    }));
  }

  async getUserJobStats(userId: string | any) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = typeof userId === 'string' ? userId : userId?.id;

    const [applications, savedJobs, interviews] = await Promise.all([
      // Get user applications
      this.prisma.jobApplication.findMany({
        where: { userId: actualUserId },
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
      // Get saved jobs count
      this.prisma.savedJob.count({
        where: { userId: actualUserId },
      }),
      // Get interviews
      this.prisma.interview.findMany({
        where: {
          application: {
            userId: actualUserId,
          },
        },
        include: {
          application: {
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

    return {
      totalJobs: await this.prisma.job.count({
        where: { status: JobStatus.ACTIVE },
      }),
      newJobs: await this.prisma.job.count({
        where: {
          status: JobStatus.ACTIVE,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      applicationsSent: totalApplications,
      savedJobs,
      interviewInvites,
      responseRate,
      applicationBreakdown: {
        pending: pendingApplications,
        accepted: acceptedApplications,
        rejected: rejectedApplications,
      },
      recentActivity: {
        applications: recentApplications.length,
        period: '30 days',
      },
    };
  }
}
