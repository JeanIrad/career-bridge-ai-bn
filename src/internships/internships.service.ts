import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  InternshipSearchDto,
  CreateInternshipDto,
  UpdateInternshipDto,
  CreateInternshipApplicationDto,
  UpdateApplicationStatusDto,
  InternshipStatsDto,
} from './dto/internship.dto';
import { JobStatus, ApplicationStatus, Prisma } from '@prisma/client';

@Injectable()
export class InternshipsService {
  constructor(private prisma: PrismaService) {}

  // Helper method to extract user ID
  private extractUserId(userId: string | any): string {
    if (typeof userId === 'string') {
      return userId;
    }
    return userId?.id || userId?.userId || userId;
  }

  // Search internships with filters
  async searchInternships(dto: InternshipSearchDto, userId?: string) {
    const {
      search,
      locations,
      companies,
      types,
      duration,
      compensationType,
      minStipend,
      maxStipend,
      housingProvided,
      mentorshipProvided,
      fullTimeConversion,
      minGpa,
      graduationYear,
      majors,
      skills,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = dto;

    const where: Prisma.JobWhereInput = {
      isInternship: true,
      status: JobStatus.ACTIVE,
      deletedAt: null,
      applicationDeadline: {
        gte: new Date(),
      },
    };

    // Text search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Location filter
    if (locations && locations.length > 0) {
      where.location = { in: locations };
    }

    // Company filter
    if (companies && companies.length > 0) {
      where.company = {
        name: { in: companies },
      };
    }

    // Type filter
    if (types && types.length > 0) {
      where.type = { in: types };
    }

    // Duration filter
    if (duration) {
      where.duration = duration;
    }

    // Compensation type filter
    if (compensationType) {
      where.compensationType = compensationType;
    }

    // Stipend range filter
    if (minStipend !== undefined || maxStipend !== undefined) {
      where.stipendAmount = {};
      if (minStipend !== undefined) {
        where.stipendAmount.gte = minStipend;
      }
      if (maxStipend !== undefined) {
        where.stipendAmount.lte = maxStipend;
      }
    }

    // Housing filter
    if (housingProvided !== undefined) {
      where.housingProvided = housingProvided;
    }

    // Mentorship filter
    if (mentorshipProvided !== undefined) {
      where.mentorshipProvided = mentorshipProvided;
    }

    // Full-time conversion filter
    if (fullTimeConversion !== undefined) {
      where.fullTimeConversion = fullTimeConversion;
    }

    // GPA requirement filter
    if (minGpa !== undefined) {
      where.OR = [
        { gpaRequirement: null },
        { gpaRequirement: { lte: minGpa } },
      ];
    }

    // Graduation year filter
    if (graduationYear !== undefined) {
      where.OR = [{ graduationYear: null }, { graduationYear: graduationYear }];
    }

    // Major filter
    if (majors && majors.length > 0) {
      where.OR = [
        { eligibleMajors: { isEmpty: true } },
        { eligibleMajors: { hasSome: majors } },
      ];
    }

    // Skills filter
    if (skills && skills.length > 0) {
      where.OR = [
        { preferredSkills: { isEmpty: true } },
        { preferredSkills: { hasSome: skills } },
      ];
    }

    const orderBy: Prisma.JobOrderByWithRelationInput = {};
    if (sortBy === 'stipend') {
      orderBy.stipendAmount = sortOrder;
    } else if (sortBy === 'deadline') {
      orderBy.applicationDeadline = sortOrder;
    } else if (sortBy === 'company') {
      orderBy.company = { name: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [internships, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
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
              savedByUsers: true,
            },
          },
          ...(userId && {
            applications: {
              where: { userId: this.extractUserId(userId) },
              select: {
                id: true,
                status: true,
                appliedAt: true,
              },
            },
            savedByUsers: {
              where: { userId: this.extractUserId(userId) },
              select: { id: true },
            },
          }),
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    // Add computed fields
    const enrichedInternships = internships.map((internship) => ({
      ...internship,
      userApplication: internship.applications?.[0] || null,
      isSaved: internship.savedByUsers?.length > 0,
      applications: undefined,
      savedByUsers: undefined,
    }));

    return {
      internships: enrichedInternships,
      total,
      hasMore: offset + limit < total,
      pagination: {
        limit,
        offset,
        total,
        pages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1,
      },
    };
  }

  // Get internship by ID
  async getInternshipById(id: string, userId?: string) {
    const internship = await this.prisma.job.findFirst({
      where: {
        id,
        isInternship: true,
        deletedAt: null,
      },
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
            savedByUsers: true,
          },
        },
        ...(userId && {
          applications: {
            where: { userId: this.extractUserId(userId) },
            select: {
              id: true,
              status: true,
              appliedAt: true,
              feedback: true,
            },
          },
          savedByUsers: {
            where: { userId: this.extractUserId(userId) },
            select: { id: true },
          },
        }),
      },
    });

    if (!internship) {
      throw new NotFoundException('Internship not found');
    }

    return {
      ...internship,
      userApplication: internship.applications?.[0] || null,
      isSaved: internship.savedByUsers?.length > 0,
      applications: undefined,
      savedByUsers: undefined,
    };
  }

  // Create internship (for employers)
  async createInternship(dto: CreateInternshipDto, userId: string | any) {
    const userIdStr = this.extractUserId(userId);

    // Verify user is an employer and owns the company
    const user = await this.prisma.user.findUnique({
      where: { id: userIdStr },
      include: { companies: true },
    });

    if (!user || user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Only employers can create internships');
    }

    const company = user.companies.find((c) => c.id === dto.companyId);
    if (!company) {
      throw new ForbiddenException(
        'You can only create internships for your own company',
      );
    }

    const internshipData = {
      ...dto,
      salary: dto.salary as any, // Convert to JSON
      postedById: userIdStr,
      applicationDeadline: new Date(dto.applicationDeadline),
      applicationOpenDate: dto.applicationOpenDate
        ? new Date(dto.applicationOpenDate)
        : null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    };

    return this.prisma.job.create({
      data: internshipData,
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
            savedByUsers: true,
          },
        },
      },
    });
  }

  // Update internship
  async updateInternship(
    id: string,
    dto: UpdateInternshipDto,
    userId: string | any,
  ) {
    const userIdStr = this.extractUserId(userId);

    const internship = await this.prisma.job.findFirst({
      where: {
        id,
        isInternship: true,
        deletedAt: null,
      },
      include: { company: { include: { owner: true } } },
    });

    if (!internship) {
      throw new NotFoundException('Internship not found');
    }

    if (
      internship.postedById !== userIdStr &&
      internship.company.ownerId !== userIdStr
    ) {
      throw new ForbiddenException('You can only update your own internships');
    }

    const updateData = {
      ...dto,
      ...(dto.salary && { salary: dto.salary as any }), // Convert to JSON
      ...(dto.applicationDeadline && {
        applicationDeadline: new Date(dto.applicationDeadline),
      }),
      ...(dto.applicationOpenDate && {
        applicationOpenDate: new Date(dto.applicationOpenDate),
      }),
      ...(dto.startDate && { startDate: new Date(dto.startDate) }),
      ...(dto.endDate && { endDate: new Date(dto.endDate) }),
    };

    return this.prisma.job.update({
      where: { id },
      data: updateData,
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
            savedByUsers: true,
          },
        },
      },
    });
  }

  // Delete internship
  async deleteInternship(id: string, userId: string | any) {
    const userIdStr = this.extractUserId(userId);

    const internship = await this.prisma.job.findFirst({
      where: {
        id,
        isInternship: true,
        deletedAt: null,
      },
      include: { company: { include: { owner: true } } },
    });

    if (!internship) {
      throw new NotFoundException('Internship not found');
    }

    if (
      internship.postedById !== userIdStr &&
      internship.company.ownerId !== userIdStr
    ) {
      throw new ForbiddenException('You can only delete your own internships');
    }

    return this.prisma.job.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Apply to internship
  async applyToInternship(
    dto: CreateInternshipApplicationDto,
    userId: string | any,
  ) {
    const userIdStr = this.extractUserId(userId);

    // Check if internship exists and is active
    const internship = await this.prisma.job.findFirst({
      where: {
        id: dto.internshipId,
        isInternship: true,
        status: JobStatus.ACTIVE,
        deletedAt: null,
        applicationDeadline: { gte: new Date() },
      },
    });

    if (!internship) {
      throw new NotFoundException(
        'Internship not found or application deadline has passed',
      );
    }

    // Check if user already applied
    const existingApplication = await this.prisma.jobApplication.findFirst({
      where: {
        jobId: dto.internshipId,
        userId: userIdStr,
        deletedAt: null,
      },
    });

    if (existingApplication) {
      throw new BadRequestException(
        'You have already applied to this internship',
      );
    }

    return this.prisma.jobApplication.create({
      data: {
        jobId: dto.internshipId,
        userId: userIdStr,
        resumeUrl: dto.resumeUrl,
        coverLetter: dto.coverLetter,
        source: dto.source,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: { select: { name: true } },
          },
        },
      },
    });
  }

  // Get user's internship applications
  async getUserApplications(userId: string | any, status?: string) {
    const userIdStr = this.extractUserId(userId);

    const where: Prisma.JobApplicationWhereInput = {
      userId: userIdStr,
      deletedAt: null,
      job: {
        isInternship: true,
        deletedAt: null,
      },
    };

    if (status) {
      where.status = status as ApplicationStatus;
    }

    return this.prisma.jobApplication.findMany({
      where,
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
                industry: true,
                isVerified: true,
              },
            },
          },
        },
        interviews: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  // Save/unsave internship
  async toggleSaveInternship(internshipId: string, userId: string | any) {
    const userIdStr = this.extractUserId(userId);

    // Check if internship exists
    const internship = await this.prisma.job.findFirst({
      where: {
        id: internshipId,
        isInternship: true,
        deletedAt: null,
      },
    });

    if (!internship) {
      throw new NotFoundException('Internship not found');
    }

    // Check if already saved
    const existingSave = await this.prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: userIdStr,
          jobId: internshipId,
        },
      },
    });

    if (existingSave) {
      // Remove save
      await this.prisma.savedJob.delete({
        where: { id: existingSave.id },
      });
      return { saved: false };
    } else {
      // Add save
      await this.prisma.savedJob.create({
        data: {
          userId: userIdStr,
          jobId: internshipId,
        },
      });
      return { saved: true };
    }
  }

  // Get saved internships
  async getSavedInternships(userId: string | any) {
    const userIdStr = this.extractUserId(userId);

    const savedJobs = await this.prisma.savedJob.findMany({
      where: {
        userId: userIdStr,
        job: {
          isInternship: true,
          deletedAt: null,
        },
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
              },
            },
            _count: {
              select: {
                applications: true,
                savedByUsers: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return savedJobs.map((save) => ({
      ...save.job,
      savedAt: save.createdAt,
      isSaved: true,
    }));
  }

  // Get internship dashboard stats
  async getInternshipStats(userId: string | any): Promise<InternshipStatsDto> {
    const userIdStr = this.extractUserId(userId);

    const [
      totalInternships,
      appliedInternships,
      savedInternships,
      interviewInvites,
      acceptedApplications,
      pendingApplications,
    ] = await Promise.all([
      this.prisma.job.count({
        where: {
          isInternship: true,
          status: JobStatus.ACTIVE,
          deletedAt: null,
          applicationDeadline: { gte: new Date() },
        },
      }),
      this.prisma.jobApplication.count({
        where: {
          userId: userIdStr,
          deletedAt: null,
          job: { isInternship: true, deletedAt: null },
        },
      }),
      this.prisma.savedJob.count({
        where: {
          userId: userIdStr,
          job: { isInternship: true, deletedAt: null },
        },
      }),
      this.prisma.interview.count({
        where: {
          application: {
            userId: userIdStr,
            job: { isInternship: true, deletedAt: null },
          },
        },
      }),
      this.prisma.jobApplication.count({
        where: {
          userId: userIdStr,
          status: ApplicationStatus.ACCEPTED,
          deletedAt: null,
          job: { isInternship: true, deletedAt: null },
        },
      }),
      this.prisma.jobApplication.count({
        where: {
          userId: userIdStr,
          status: ApplicationStatus.PENDING,
          deletedAt: null,
          job: { isInternship: true, deletedAt: null },
        },
      }),
    ]);

    return {
      totalInternships,
      appliedInternships,
      savedInternships,
      interviewInvites,
      acceptedApplications,
      pendingApplications,
    };
  }

  // Get popular companies for internships
  async getPopularCompanies(limit: number = 10) {
    const companies = await this.prisma.company.findMany({
      where: {
        jobs: {
          some: {
            isInternship: true,
            status: JobStatus.ACTIVE,
            deletedAt: null,
          },
        },
      },
      include: {
        _count: {
          select: {
            jobs: {
              where: {
                isInternship: true,
                status: JobStatus.ACTIVE,
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        jobs: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return companies.map((company) => ({
      id: company.id,
      name: company.name,
      logo: company.logo,
      industry: company.industry,
      isVerified: company.isVerified,
      internshipCount: company._count.jobs,
    }));
  }

  // Get internship types/categories
  async getInternshipTypes() {
    const types = await this.prisma.job.groupBy({
      by: ['type'],
      where: {
        isInternship: true,
        status: JobStatus.ACTIVE,
        deletedAt: null,
      },
      _count: {
        type: true,
      },
      orderBy: {
        _count: {
          type: 'desc',
        },
      },
    });

    return types.map((type) => ({
      name: type.type,
      count: type._count.type,
    }));
  }

  // Get internship locations
  async getInternshipLocations() {
    const locations = await this.prisma.job.groupBy({
      by: ['location'],
      where: {
        isInternship: true,
        status: JobStatus.ACTIVE,
        deletedAt: null,
      },
      _count: {
        location: true,
      },
      orderBy: {
        _count: {
          location: 'desc',
        },
      },
      take: 20,
    });

    return locations.map((location) => ({
      name: location.location,
      count: location._count.location,
    }));
  }
}
