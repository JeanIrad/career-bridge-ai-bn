import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  CreateEventDto,
  UpdateEventDto,
  EventSearchDto,
  RegisterForEventDto,
  EventFeedbackDto,
  EventAnalyticsDto,
  EventCategory,
  EventMode,
  EventStatus,
  RegistrationStatus,
  AttendanceStatus,
} from './dto/events.dto';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // Helper method to safely extract user ID
  private extractUserId(userId: string | any): string {
    if (typeof userId === 'string') {
      return userId;
    }
    if (userId && typeof userId === 'object' && userId.id) {
      return userId.id;
    }
    throw new BadRequestException('Invalid user ID provided');
  }

  // Create a new event
  async createEvent(userId: string | any, createEventDto: CreateEventDto) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = this.extractUserId(userId);

    const { startDate, endDate, registrationDeadline, ...eventData } =
      createEventDto;

    // Validate dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    const parsedRegistrationDeadline = registrationDeadline
      ? new Date(registrationDeadline)
      : null;

    if (parsedStartDate >= parsedEndDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (
      parsedRegistrationDeadline &&
      parsedRegistrationDeadline >= parsedStartDate
    ) {
      throw new BadRequestException(
        'Registration deadline must be before event start date',
      );
    }

    const event = await this.prisma.event.create({
      data: {
        ...eventData,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        registrationDeadline: parsedRegistrationDeadline,
        creatorId: actualUserId,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        university: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            attendees: true,
            feedback: true,
          },
        },
      },
    });

    return event;
  }

  // Get all events with filtering and pagination
  async getEvents(searchDto: EventSearchDto) {
    const {
      search,
      category,
      mode,
      status,
      city,
      state,
      country,
      startDateFrom,
      startDateTo,
      companyId,
      universityId,
      isFeatured,
      isFree,
      tags,
      page = 1,
      limit = 10,
      sortBy = 'startDate',
      sortOrder = 'asc',
    } = searchDto;

    const where: any = {
      isPublic: true,
      deletedAt: null,
    };

    // Text search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filters
    if (category) where.category = category;
    if (mode) where.mode = mode;
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (country) where.country = { contains: country, mode: 'insensitive' };
    if (companyId) where.companyId = companyId;
    if (universityId) where.universityId = universityId;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isFree !== undefined) {
      where.registrationFee = isFree ? 0 : { gt: 0 };
    }

    // Date range filter
    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
      if (startDateTo) where.startDate.lte = new Date(startDateTo);
    }

    // Tags filter
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const skip = (page - 1) * limit;
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          university: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          _count: {
            select: {
              registrations: true,
              attendees: true,
              feedback: true,
            },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get event by ID
  async getEventById(eventId: string, userId?: string | any) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = userId ? this.extractUserId(userId) : undefined;

    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
          },
        },
        university: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
          },
        },
        registrations: actualUserId
          ? {
              where: { userId: actualUserId },
              select: {
                id: true,
                status: true,
                registeredAt: true,
                attendanceStatus: true,
              },
            }
          : false,
        feedback: {
          where: { isPublic: true },
          select: {
            id: true,
            overallRating: true,
            feedback: true,
            highlights: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            registrations: true,
            attendees: true,
            feedback: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Increment view count
    await this.prisma.event.update({
      where: { id: eventId },
      data: { viewCount: { increment: 1 } },
    });

    return event;
  }

  // Update event
  async updateEvent(
    eventId: string,
    userId: string | any,
    updateEventDto: UpdateEventDto,
  ) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = this.extractUserId(userId);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.creatorId !== actualUserId) {
      throw new ForbiddenException('You can only update your own events');
    }

    const { startDate, endDate, registrationDeadline, ...eventData } =
      updateEventDto;

    const updateData: any = { ...eventData };

    // Validate and update dates
    if (startDate) {
      updateData.startDate = new Date(startDate);
    }
    if (endDate) {
      updateData.endDate = new Date(endDate);
    }
    if (registrationDeadline) {
      updateData.registrationDeadline = new Date(registrationDeadline);
    }

    // Validate date logic if both dates are being updated
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate >= updateData.endDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        company: true,
        university: true,
        _count: {
          select: {
            registrations: true,
            attendees: true,
            feedback: true,
          },
        },
      },
    });

    return updatedEvent;
  }

  // Delete event
  async deleteEvent(eventId: string, userId: string | any) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = this.extractUserId(userId);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.creatorId !== actualUserId) {
      throw new ForbiddenException('You can only delete your own events');
    }

    await this.prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Event deleted successfully' };
  }

  // Register for event
  async registerForEvent(
    eventId: string,
    userId: string | any,
    registrationDto: RegisterForEventDto,
  ) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = this.extractUserId(userId);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.isRegistrationOpen) {
      throw new BadRequestException('Registration is closed for this event');
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new BadRequestException('Registration deadline has passed');
    }

    // Check if already registered
    const existingRegistration = await this.prisma.eventRegistration.findUnique(
      {
        where: {
          eventId_userId: {
            eventId,
            userId: actualUserId,
          },
        },
      },
    );

    if (existingRegistration) {
      throw new BadRequestException(
        'You are already registered for this event',
      );
    }

    // Check capacity
    const registrationStatus =
      event._count.registrations >= event.capacity
        ? RegistrationStatus.WAITLISTED
        : RegistrationStatus.REGISTERED;

    const registration = await this.prisma.eventRegistration.create({
      data: {
        eventId,
        userId: actualUserId,
        status: registrationStatus,
        ...registrationDto,
      },
      include: {
        event: {
          select: {
            title: true,
            startDate: true,
            location: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Update event attendee count
    await this.prisma.event.update({
      where: { id: eventId },
      data: { currentAttendees: { increment: 1 } },
    });

    return registration;
  }

  // Cancel event registration
  async cancelRegistration(eventId: string, userId: string | any) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = this.extractUserId(userId);

    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: actualUserId,
        },
      },
      include: {
        event: {
          select: {
            title: true,
            startDate: true,
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    await this.prisma.$transaction([
      this.prisma.eventRegistration.update({
        where: { id: registration.id },
        data: {
          status: RegistrationStatus.CANCELLED,
          deletedAt: new Date(),
        },
      }),
      this.prisma.event.update({
        where: { id: eventId },
        data: { currentAttendees: { decrement: 1 } },
      }),
    ]);

    return { message: 'Registration cancelled successfully' };
  }

  // Check in to event
  async checkInToEvent(eventId: string, userId: string | any) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = this.extractUserId(userId);

    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: actualUserId,
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot check in to cancelled registration',
      );
    }

    // Create or update attendance record
    const attendance = await this.prisma.eventAttendee.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: actualUserId,
        },
      },
      update: {
        checkedInAt: new Date(),
      },
      create: {
        eventId,
        userId: actualUserId,
        checkedInAt: new Date(),
      },
    });

    // Update registration status
    await this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        attendanceStatus: AttendanceStatus.CHECKED_IN,
        checkedInAt: new Date(),
      },
    });

    return attendance;
  }

  // Submit event feedback
  async submitEventFeedback(
    eventId: string,
    userId: string | any,
    feedbackDto: EventFeedbackDto,
  ) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = this.extractUserId(userId);

    // Check if user attended the event
    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: actualUserId,
        },
      },
    });

    if (!registration) {
      throw new BadRequestException(
        'You must be registered for the event to leave feedback',
      );
    }

    // Check if feedback already exists
    const existingFeedback = await this.prisma.eventFeedback.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: actualUserId,
        },
      },
    });

    if (existingFeedback) {
      throw new BadRequestException(
        'You have already submitted feedback for this event',
      );
    }

    const feedback = await this.prisma.eventFeedback.create({
      data: {
        eventId,
        userId: actualUserId,
        ...feedbackDto,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
      },
    });

    return feedback;
  }

  // Get user's registered events
  async getUserEvents(userId: string | any, status?: RegistrationStatus) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = this.extractUserId(userId);

    const where: any = {
      userId: actualUserId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const registrations = await this.prisma.eventRegistration.findMany({
      where,
      include: {
        event: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            university: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            _count: {
              select: {
                registrations: true,
                attendees: true,
              },
            },
          },
        },
      },
      orderBy: {
        event: {
          startDate: 'asc',
        },
      },
    });

    return registrations;
  }

  // Get event analytics
  async getEventAnalytics(analyticsDto: EventAnalyticsDto, userId?: string) {
    const { startDate, endDate, categories, companyId, universityId } =
      analyticsDto;

    const where: any = {
      deletedAt: null,
    };

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Other filters
    if (categories && categories.length > 0) {
      where.category = { in: categories };
    }
    if (companyId) where.companyId = companyId;
    if (universityId) where.universityId = universityId;
    if (userId) where.creatorId = userId;

    const [
      totalEvents,
      eventsByCategory,
      eventsByMode,
      eventsByStatus,
      registrationStats,
      attendanceStats,
      feedbackStats,
    ] = await Promise.all([
      // Total events
      this.prisma.event.count({ where }),

      // Events by category
      this.prisma.event.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),

      // Events by mode
      this.prisma.event.groupBy({
        by: ['mode'],
        where,
        _count: true,
      }),

      // Events by status
      this.prisma.event.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      // Registration statistics
      this.prisma.eventRegistration.aggregate({
        where: {
          event: where,
          deletedAt: null,
        },
        _count: true,
      }),

      // Attendance statistics
      this.prisma.eventAttendee.aggregate({
        where: {
          event: where,
        },
        _count: true,
      }),

      // Feedback statistics
      this.prisma.eventFeedback.aggregate({
        where: {
          event: where,
        },
        _count: true,
        _avg: {
          overallRating: true,
          contentRating: true,
          organizationRating: true,
          venueRating: true,
          networkingRating: true,
        },
      }),
    ]);

    return {
      totalEvents,
      eventsByCategory,
      eventsByMode,
      eventsByStatus,
      registrations: {
        total: registrationStats._count,
      },
      attendance: {
        total: attendanceStats._count,
      },
      feedback: {
        total: feedbackStats._count,
        averageRatings: {
          overall: feedbackStats._avg.overallRating,
          content: feedbackStats._avg.contentRating,
          organization: feedbackStats._avg.organizationRating,
          venue: feedbackStats._avg.venueRating,
          networking: feedbackStats._avg.networkingRating,
        },
      },
    };
  }

  // Get featured events
  async getFeaturedEvents(limit: number = 6) {
    const events = await this.prisma.event.findMany({
      where: {
        isFeatured: true,
        isPublic: true,
        deletedAt: null,
        status: { in: [EventStatus.UPCOMING, EventStatus.ONGOING] },
      },
      take: limit,
      orderBy: [{ priority: 'desc' }, { startDate: 'asc' }],
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        university: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            attendees: true,
          },
        },
      },
    });

    return events;
  }

  // Get upcoming events
  async getUpcomingEvents(limit: number = 10) {
    const events = await this.prisma.event.findMany({
      where: {
        isPublic: true,
        deletedAt: null,
        status: EventStatus.UPCOMING,
        startDate: { gte: new Date() },
      },
      take: limit,
      orderBy: { startDate: 'asc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        university: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            attendees: true,
          },
        },
      },
    });

    return events;
  }

  // Get saved events for user
  async getSavedEvents(userId: string | any) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = this.extractUserId(userId);

    const savedEvents = await this.prisma.savedEvent.findMany({
      where: { userId: actualUserId },
      include: {
        event: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            university: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            _count: {
              select: {
                registrations: true,
                attendees: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to return the events with saved status
    return savedEvents.map((saved) => ({
      ...saved.event,
      savedAt: saved.createdAt,
      isSaved: true,
    }));
  }

  // Save an event
  async saveEvent(eventId: string, userId: string | any) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = this.extractUserId(userId);

    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if already saved
    const existingSaved = await this.prisma.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId: actualUserId,
          eventId,
        },
      },
    });

    if (existingSaved) {
      throw new ConflictException('Event already saved');
    }

    await this.prisma.savedEvent.create({
      data: {
        userId: actualUserId,
        eventId,
      },
    });

    return { message: 'Event saved successfully' };
  }

  // Unsave an event
  async unsaveEvent(eventId: string, userId: string | any) {
    // Handle case where userId might be a user object instead of string
    const actualUserId = this.extractUserId(userId);

    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if saved
    const savedEvent = await this.prisma.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId: actualUserId,
          eventId,
        },
      },
    });

    if (!savedEvent) {
      throw new NotFoundException('Saved event not found');
    }

    await this.prisma.savedEvent.delete({
      where: {
        userId_eventId: {
          userId: actualUserId,
          eventId,
        },
      },
    });

    return { message: 'Event unsaved successfully' };
  }
}
