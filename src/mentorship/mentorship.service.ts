import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateMentorProfileDto,
  UpdateMentorProfileDto,
  CreateMentorshipRequestDto,
  RespondToMentorshipRequestDto,
  CreateSessionDto,
  UpdateSessionDto,
  CreateSessionFeedbackDto,
  CreateMentorshipReviewDto,
  CreateGoalDto,
  UpdateGoalDto,
  MentorSearchDto,
  SessionFilterDto,
} from './dto/mentorship.dto';
import {
  MentorshipRequestStatus,
  MentorshipStatus,
  SessionStatus,
  GoalStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class MentorshipService {
  constructor(private prisma: PrismaService) {}

  // Helper method to extract user ID
  private extractUserId(userId: string | any): string {
    if (typeof userId === 'string') {
      return userId;
    }
    if (userId && typeof userId === 'object' && userId.id) {
      return userId.id;
    }
    throw new BadRequestException('Invalid user ID format');
  }

  // Mentor Profile Management
  async createMentorProfile(userId: string | any, dto: CreateMentorProfileDto) {
    const userIdStr = this.extractUserId(userId);

    // Check if user already has a mentor profile
    const existingProfile = await this.prisma.mentorProfile.findUnique({
      where: { userId: userIdStr },
    });

    if (existingProfile) {
      throw new BadRequestException('User already has a mentor profile');
    }

    return this.prisma.mentorProfile.create({
      data: {
        userId: userIdStr,
        ...dto,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async updateMentorProfile(userId: string | any, dto: UpdateMentorProfileDto) {
    const userIdStr = this.extractUserId(userId);

    const profile = await this.prisma.mentorProfile.findUnique({
      where: { userId: userIdStr },
    });

    if (!profile) {
      throw new NotFoundException('Mentor profile not found');
    }

    return this.prisma.mentorProfile.update({
      where: { userId: userIdStr },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getMentorProfile(userId: string | any) {
    const userIdStr = this.extractUserId(userId);

    const profile = await this.prisma.mentorProfile.findUnique({
      where: { userId: userIdStr },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        mentorReviews: {
          where: { isPublic: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            mentorshipRequests: true,
            mentorshipSessions: true,
            mentorReviews: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Mentor profile not found');
    }

    return profile;
  }

  async searchMentors(dto: MentorSearchDto) {
    const {
      search,
      expertise,
      industries,
      minExperience,
      maxExperience,
      isAvailable,
      isVerified,
      isPaidMentor,
      minRating,
      preferredMeetingMode,
      sortBy = 'averageRating',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = dto;

    const where: Prisma.MentorProfileWhereInput = {
      isPublic: true,
      status: 'ACTIVE',
    };

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { bio: { contains: search, mode: 'insensitive' } },
        { currentRole: { contains: search, mode: 'insensitive' } },
        { currentCompany: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (expertise && expertise.length > 0) {
      where.expertise = { hasSome: expertise };
    }

    if (industries && industries.length > 0) {
      where.industries = { hasSome: industries };
    }

    if (minExperience !== undefined) {
      where.yearsOfExperience = { gte: minExperience };
    }

    if (maxExperience !== undefined) {
      const existingCondition = where.yearsOfExperience as Prisma.IntFilter;
      where.yearsOfExperience = {
        ...(existingCondition || {}),
        lte: maxExperience,
      };
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }

    if (isPaidMentor !== undefined) {
      where.isPaidMentor = isPaidMentor;
    }

    if (minRating !== undefined) {
      where.averageRating = { gte: minRating };
    }

    if (preferredMeetingMode) {
      where.preferredMeetingMode = preferredMeetingMode;
    }

    const orderBy: Prisma.MentorProfileOrderByWithRelationInput = {};
    if (sortBy === 'averageRating') {
      orderBy.averageRating = sortOrder;
    } else if (sortBy === 'totalReviews') {
      orderBy.totalReviews = sortOrder;
    } else if (sortBy === 'yearsOfExperience') {
      orderBy.yearsOfExperience = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [mentors, total] = await Promise.all([
      this.prisma.mentorProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              mentorReviews: true,
              mentorshipSessions: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.mentorProfile.count({ where }),
    ]);

    return {
      mentors,
      total,
      hasMore: offset + limit < total,
    };
  }

  // Mentorship Requests
  async createMentorshipRequest(
    menteeId: string | any,
    dto: CreateMentorshipRequestDto,
  ) {
    const menteeIdStr = this.extractUserId(menteeId);

    // Check if mentor exists and is available
    const mentor = await this.prisma.mentorProfile.findUnique({
      where: { id: dto.mentorId },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor not found');
    }

    if (!mentor.isAvailable) {
      throw new BadRequestException('Mentor is not currently available');
    }

    // Check if mentee already has a pending request to this mentor
    const existingRequest = await this.prisma.mentorshipRequest.findFirst({
      where: {
        menteeId: menteeIdStr,
        mentorId: dto.mentorId,
        status: MentorshipRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'You already have a pending request to this mentor',
      );
    }

    const requestData: any = {
      menteeId: menteeIdStr,
      ...dto,
    };

    // Handle date fields
    if (dto.startDate) {
      requestData.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      requestData.endDate = new Date(dto.endDate);
    }

    return this.prisma.mentorshipRequest.create({
      data: requestData,
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async respondToMentorshipRequest(
    mentorUserId: string | any,
    requestId: string,
    dto: RespondToMentorshipRequestDto,
  ) {
    const mentorUserIdStr = this.extractUserId(mentorUserId);

    const request = await this.prisma.mentorshipRequest.findUnique({
      where: { id: requestId },
      include: {
        mentor: true,
        mentee: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Mentorship request not found');
    }

    if (request.mentor.userId !== mentorUserIdStr) {
      throw new ForbiddenException(
        'You can only respond to your own mentorship requests',
      );
    }

    if (request.status !== MentorshipRequestStatus.PENDING) {
      throw new BadRequestException(
        'This request has already been responded to',
      );
    }

    const updateData: any = {
      ...dto,
      respondedAt: new Date(),
    };

    // Handle date fields
    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      updateData.endDate = new Date(dto.endDate);
    }

    const updatedRequest = await this.prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // If accepted, create a mentorship relationship
    if (dto.status === MentorshipRequestStatus.ACCEPTED) {
      await this.prisma.mentorship.create({
        data: {
          requestId: requestId,
          mentorId: request.mentorId,
          menteeId: request.menteeId,
          title: request.title,
          description: request.description,
          goals: request.goals,
          startDate: updateData.startDate || new Date(),
          endDate: updateData.endDate,
          meetingFrequency: request.meetingFrequency || 'weekly',
          status: MentorshipStatus.ACTIVE,
        },
      });
    }

    return updatedRequest;
  }

  async getMentorshipRequests(userId: string | any, type: 'sent' | 'received') {
    const userIdStr = this.extractUserId(userId);

    let where: Prisma.MentorshipRequestWhereInput;

    if (type === 'sent') {
      where = { menteeId: userIdStr };
    } else {
      // For received requests, find mentor profile first
      const mentorProfile = await this.prisma.mentorProfile.findUnique({
        where: { userId: userIdStr },
      });

      if (!mentorProfile) {
        return [];
      }

      where = { mentorId: mentorProfile.id };
    }

    return this.prisma.mentorshipRequest.findMany({
      where,
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Session Management
  async createSession(mentorUserId: string | any, dto: CreateSessionDto) {
    const mentorUserIdStr = this.extractUserId(mentorUserId);

    const mentorProfile = await this.prisma.mentorProfile.findUnique({
      where: { userId: mentorUserIdStr },
    });

    if (!mentorProfile) {
      throw new NotFoundException('Mentor profile not found');
    }

    const sessionData: any = {
      mentorId: mentorProfile.id,
      ...dto,
      scheduledAt: new Date(dto.scheduledAt),
    };

    return this.prisma.mentorshipSession.create({
      data: sessionData,
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        mentorship: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async updateSession(
    userId: string | any,
    sessionId: string,
    dto: UpdateSessionDto,
  ) {
    const userIdStr = this.extractUserId(userId);

    const session = await this.prisma.mentorshipSession.findUnique({
      where: { id: sessionId },
      include: { mentor: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.menteeId !== userIdStr && session.mentor.userId !== userIdStr) {
      throw new ForbiddenException('You can only update your own sessions');
    }

    const updateData: Prisma.MentorshipSessionUpdateInput = {};

    // Copy primitive fields
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.agenda !== undefined) updateData.agenda = dto.agenda;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.timeZone !== undefined) updateData.timeZone = dto.timeZone;
    if (dto.meetingMode !== undefined) updateData.meetingMode = dto.meetingMode;
    if (dto.meetingLink !== undefined) updateData.meetingLink = dto.meetingLink;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.sessionNotes !== undefined)
      updateData.sessionNotes = dto.sessionNotes;
    if (dto.actionItems !== undefined) updateData.actionItems = dto.actionItems;
    if (dto.resources !== undefined) updateData.resources = dto.resources;
    if (dto.mentorAttended !== undefined)
      updateData.mentorAttended = dto.mentorAttended;
    if (dto.menteeAttended !== undefined)
      updateData.menteeAttended = dto.menteeAttended;
    if (dto.noShowReason !== undefined)
      updateData.noShowReason = dto.noShowReason;
    if (dto.followUpRequired !== undefined)
      updateData.followUpRequired = dto.followUpRequired;

    // Handle date fields
    if (dto.scheduledAt) {
      updateData.scheduledAt = new Date(dto.scheduledAt);
    }
    if (dto.nextSessionDate) {
      updateData.nextSessionDate = new Date(dto.nextSessionDate);
    }

    return this.prisma.mentorshipSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        mentorship: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async getSessions(userId: string | any, filters: SessionFilterDto) {
    const userIdStr = this.extractUserId(userId);

    // Check if user is a mentor
    const mentorProfile = await this.prisma.mentorProfile.findUnique({
      where: { userId: userIdStr },
    });

    const where: Prisma.MentorshipSessionWhereInput = {
      OR: [
        { menteeId: userIdStr },
        ...(mentorProfile ? [{ mentorId: mentorProfile.id }] : []),
      ],
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate) {
      where.scheduledAt = { gte: new Date(filters.startDate) };
    }

    if (filters.endDate) {
      const existingCondition = where.scheduledAt as Prisma.DateTimeFilter;
      where.scheduledAt = {
        ...(existingCondition || {}),
        lte: new Date(filters.endDate),
      };
    }

    if (filters.sessionType) {
      where.sessionType = filters.sessionType;
    }

    if (filters.mentorshipId) {
      where.mentorshipId = filters.mentorshipId;
    }

    const orderBy: Prisma.MentorshipSessionOrderByWithRelationInput = {};
    orderBy[filters.sortBy || 'scheduledAt'] = filters.sortOrder || 'desc';

    const [sessions, total] = await Promise.all([
      this.prisma.mentorshipSession.findMany({
        where,
        include: {
          mentor: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          mentee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          mentorship: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy,
        take: filters.limit || 20,
        skip: filters.offset || 0,
      }),
      this.prisma.mentorshipSession.count({ where }),
    ]);

    return {
      sessions,
      total,
      hasMore: (filters.offset || 0) + (filters.limit || 20) < total,
    };
  }

  async getUpcomingSessions(userId: string | any) {
    const userIdStr = this.extractUserId(userId);

    const mentorProfile = await this.prisma.mentorProfile.findUnique({
      where: { userId: userIdStr },
    });

    return this.prisma.mentorshipSession.findMany({
      where: {
        OR: [
          { menteeId: userIdStr },
          ...(mentorProfile ? [{ mentorId: mentorProfile.id }] : []),
        ],
        status: SessionStatus.SCHEDULED,
        scheduledAt: { gte: new Date() },
      },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        mentorship: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });
  }

  // Session Feedback
  async createSessionFeedback(
    userId: string | any,
    sessionId: string,
    dto: CreateSessionFeedbackDto,
  ) {
    const userIdStr = this.extractUserId(userId);

    const session = await this.prisma.mentorshipSession.findUnique({
      where: { id: sessionId },
      include: { mentor: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.menteeId !== userIdStr && session.mentor.userId !== userIdStr) {
      throw new ForbiddenException(
        'You can only provide feedback for your own sessions',
      );
    }

    // Check if feedback already exists
    const existingFeedback = await this.prisma.sessionFeedback.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: userIdStr,
        },
      },
    });

    if (existingFeedback) {
      throw new BadRequestException(
        'You have already provided feedback for this session',
      );
    }

    return this.prisma.sessionFeedback.create({
      data: {
        sessionId,
        userId: userIdStr,
        ...dto,
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  // Mentorship Reviews
  async createMentorshipReview(
    reviewerId: string | any,
    mentorId: string,
    dto: CreateMentorshipReviewDto,
  ) {
    const reviewerIdStr = this.extractUserId(reviewerId);

    const mentor = await this.prisma.mentorProfile.findUnique({
      where: { id: mentorId },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor not found');
    }

    // Check if reviewer has an active or completed mentorship with this mentor
    const mentorship = await this.prisma.mentorship.findFirst({
      where: {
        mentorId,
        menteeId: reviewerIdStr,
        status: { in: [MentorshipStatus.ACTIVE, MentorshipStatus.COMPLETED] },
      },
    });

    if (!mentorship && !dto.mentorshipId) {
      throw new ForbiddenException(
        'You can only review mentors you have worked with',
      );
    }

    // Check if review already exists
    const existingReview = await this.prisma.mentorshipReview.findFirst({
      where: {
        mentorId,
        reviewerId: reviewerIdStr,
        mentorshipId: dto.mentorshipId || mentorship?.id,
      },
    });

    if (existingReview) {
      throw new BadRequestException(
        'You have already reviewed this mentorship',
      );
    }

    const review = await this.prisma.mentorshipReview.create({
      data: {
        mentorId,
        reviewerId: reviewerIdStr,
        mentorshipId: dto.mentorshipId || mentorship?.id,
        ...dto,
      },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Update mentor's average rating
    const reviews = await this.prisma.mentorshipReview.findMany({
      where: { mentorId },
      select: { overallRating: true },
    });

    const averageRating =
      reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length;

    await this.prisma.mentorProfile.update({
      where: { id: mentorId },
      data: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
      },
    });

    return review;
  }

  // Goal Management
  async createGoal(
    userId: string | any,
    mentorshipId: string,
    dto: CreateGoalDto,
  ) {
    const userIdStr = this.extractUserId(userId);

    const mentorship = await this.prisma.mentorship.findUnique({
      where: { id: mentorshipId },
    });

    if (!mentorship) {
      throw new NotFoundException('Mentorship not found');
    }

    if (mentorship.menteeId !== userIdStr) {
      throw new ForbiddenException(
        'You can only create goals for your own mentorships',
      );
    }

    const goalData: Prisma.GoalTrackingCreateInput = {
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority,
      milestones: dto.milestones,
      mentorship: {
        connect: { id: mentorshipId },
      },
    };

    // Handle date fields
    if (dto.targetDate) {
      goalData.targetDate = new Date(dto.targetDate);
    }

    return this.prisma.goalTracking.create({
      data: goalData,
      include: {
        mentorship: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async updateGoal(userId: string | any, goalId: string, dto: UpdateGoalDto) {
    const userIdStr = this.extractUserId(userId);

    const goal = await this.prisma.goalTracking.findUnique({
      where: { id: goalId },
      include: { mentorship: true },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.mentorship.menteeId !== userIdStr) {
      throw new ForbiddenException('You can only update your own goals');
    }

    const updateData: Prisma.GoalTrackingUpdateInput = {};

    // Copy primitive fields
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.progress !== undefined) updateData.progress = dto.progress;
    if (dto.milestones !== undefined) updateData.milestones = dto.milestones;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // Handle date fields
    if (dto.targetDate) {
      updateData.targetDate = new Date(dto.targetDate);
    }

    // Handle completion status
    if (dto.status === GoalStatus.COMPLETED && !goal.completedAt) {
      updateData.completedAt = new Date();
    }

    // Update lastUpdated
    updateData.lastUpdated = new Date();

    return this.prisma.goalTracking.update({
      where: { id: goalId },
      data: updateData,
      include: {
        mentorship: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async getGoals(userId: string | any, mentorshipId: string) {
    const userIdStr = this.extractUserId(userId);

    const mentorship = await this.prisma.mentorship.findUnique({
      where: { id: mentorshipId },
      include: { mentor: true },
    });

    if (!mentorship) {
      throw new NotFoundException('Mentorship not found');
    }

    if (
      mentorship.menteeId !== userIdStr &&
      mentorship.mentor.userId !== userIdStr
    ) {
      throw new ForbiddenException(
        'You can only view goals for your own mentorships',
      );
    }

    return this.prisma.goalTracking.findMany({
      where: { mentorshipId },
      include: {
        updates: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Dashboard Analytics
  async getMentorDashboard(userId: string | any) {
    const userIdStr = this.extractUserId(userId);

    const mentorProfile = await this.prisma.mentorProfile.findUnique({
      where: { userId: userIdStr },
    });

    if (!mentorProfile) {
      throw new NotFoundException('Mentor profile not found');
    }

    const [
      activeMentorships,
      totalSessions,
      upcomingSessions,
      pendingRequests,
      totalReviews,
      averageRating,
      thisMonthSessions,
      completedGoals,
    ] = await Promise.all([
      this.prisma.mentorship.count({
        where: { mentorId: mentorProfile.id, status: MentorshipStatus.ACTIVE },
      }),
      this.prisma.mentorshipSession.count({
        where: { mentorId: mentorProfile.id },
      }),
      this.prisma.mentorshipSession.count({
        where: {
          mentorId: mentorProfile.id,
          status: SessionStatus.SCHEDULED,
          scheduledAt: { gte: new Date() },
        },
      }),
      this.prisma.mentorshipRequest.count({
        where: {
          mentorId: mentorProfile.id,
          status: MentorshipRequestStatus.PENDING,
        },
      }),
      this.prisma.mentorshipReview.count({
        where: { mentorId: mentorProfile.id },
      }),
      this.prisma.mentorshipReview.aggregate({
        where: { mentorId: mentorProfile.id },
        _avg: { overallRating: true },
      }),
      this.prisma.mentorshipSession.count({
        where: {
          mentorId: mentorProfile.id,
          scheduledAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.goalTracking.count({
        where: {
          mentorship: { mentorId: mentorProfile.id },
          status: GoalStatus.COMPLETED,
        },
      }),
    ]);

    return {
      activeMentorships,
      totalSessions,
      upcomingSessions,
      pendingRequests,
      totalReviews,
      averageRating: averageRating._avg.overallRating || 0,
      thisMonthSessions,
      completedGoals,
    };
  }

  async getMenteeDashboard(userId: string | any) {
    const userIdStr = this.extractUserId(userId);

    const [
      activeMentorships,
      totalSessions,
      upcomingSessions,
      pendingRequests,
      completedGoals,
      totalGoals,
      thisMonthSessions,
    ] = await Promise.all([
      this.prisma.mentorship.count({
        where: { menteeId: userIdStr, status: MentorshipStatus.ACTIVE },
      }),
      this.prisma.mentorshipSession.count({
        where: { menteeId: userIdStr },
      }),
      this.prisma.mentorshipSession.count({
        where: {
          menteeId: userIdStr,
          status: SessionStatus.SCHEDULED,
          scheduledAt: { gte: new Date() },
        },
      }),
      this.prisma.mentorshipRequest.count({
        where: {
          menteeId: userIdStr,
          status: MentorshipRequestStatus.PENDING,
        },
      }),
      this.prisma.goalTracking.count({
        where: {
          mentorship: { menteeId: userIdStr },
          status: GoalStatus.COMPLETED,
        },
      }),
      this.prisma.goalTracking.count({
        where: {
          mentorship: { menteeId: userIdStr },
        },
      }),
      this.prisma.mentorshipSession.count({
        where: {
          menteeId: userIdStr,
          scheduledAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    const goalCompletionRate =
      totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    return {
      activeMentorships,
      totalSessions,
      upcomingSessions,
      pendingRequests,
      completedGoals,
      totalGoals,
      goalCompletionRate: Math.round(goalCompletionRate),
      thisMonthSessions,
    };
  }
}
