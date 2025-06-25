import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): { app: string } {
    return this.appService.getHello();
  }

  @Get('events')
  async getEvents() {
    try {
      const events = await this.prisma.event.findMany({
        take: 10,
        where: {
          isPublic: true,
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          mode: true,
          status: true,
          startDate: true,
          endDate: true,
          location: true,
          city: true,
          state: true,
          country: true,
          isFeatured: true,
          registrationFee: true,
          capacity: true,
          currentAttendees: true,
          isRegistrationOpen: true,
          registrationDeadline: true,
          tags: true,
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
        orderBy: {
          startDate: 'asc',
        },
      });

      return {
        events,
        pagination: {
          page: 1,
          limit: 10,
          total: events.length,
          pages: Math.ceil(events.length / 10),
        },
        message: 'Events retrieved successfully from temporary endpoint',
      };
    } catch (error) {
      return {
        error: 'Failed to fetch events',
        details: error.message,
      };
    }
  }
}
