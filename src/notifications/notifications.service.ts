import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import {
  CreateNotificationDto,
  BulkNotificationDto,
  UpdateNotificationDto,
  NotificationQueryDto,
  NotificationType,
  NotificationPriority,
  NotificationPreferencesDto,
} from './dto/notification.dto';
import { Notification, User, UserRole } from '@prisma/client';

export interface NotificationResponse extends Notification {
  user?: Partial<User>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  recent: NotificationResponse[];
}

export interface PaginatedNotifications {
  notifications: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private usersService: UsersService,
  ) {}

  /**
   * Create a single notification
   */
  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationResponse> {
    const {
      userId,
      sendEmail = false,
      sendPush = true,
      ...notificationData
    } = createNotificationDto;

    // Verify user exists
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create notification in database
    const notification = await this.prisma.notification.create({
      data: {
        ...notificationData,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Send real-time notification (will be implemented later)
    if (sendPush) {
      await this.sendRealTimeNotification(userId, notification);
    }

    // Send email notification if requested
    if (sendEmail) {
      await this.sendEmailNotification(notification);
    }

    this.logger.log(
      `Notification created for user ${userId}: ${notification.title}`,
    );

    return notification;
  }

  /**
   * Create bulk notifications
   */
  async createBulkNotifications(
    bulkNotificationDto: BulkNotificationDto,
  ): Promise<NotificationResponse[]> {
    const {
      userIds,
      sendEmail = false,
      sendPush = true,
      ...notificationData
    } = bulkNotificationDto;

    // Verify all users exist
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        deletedAt: null,
      },
    });

    if (users.length !== userIds.length) {
      throw new BadRequestException('Some users not found');
    }

    // Create notifications for all users
    const notifications = await Promise.all(
      userIds.map((userId) =>
        this.prisma.notification.create({
          data: {
            ...notificationData,
            userId,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        }),
      ),
    );

    // Send real-time notifications
    if (sendPush) {
      await Promise.all(
        notifications.map((notification) =>
          this.sendRealTimeNotification(notification.userId, notification),
        ),
      );
    }

    // Send email notifications if requested
    if (sendEmail) {
      await Promise.all(
        notifications.map((notification) =>
          this.sendEmailNotification(notification),
        ),
      );
    }

    this.logger.log(
      `Bulk notifications created for ${userIds.length} users: ${notificationData.title}`,
    );

    return notifications;
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedNotifications> {
    const { page = 1, limit = 20, type, read } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      deletedAt: null,
      ...(type && { type }),
      ...(read !== undefined && { read }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponse> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /**
   * Update notification (mark as read/unread)
   */
  async updateNotification(
    notificationId: string,
    userId: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<NotificationResponse> {
    const notification = await this.getNotificationById(notificationId, userId);

    const updatedNotification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: updateNotificationDto,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return updatedNotification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponse> {
    return this.updateNotification(notificationId, userId, { read: true });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
        deletedAt: null,
      },
      data: { read: true },
    });

    return { count: result.count };
  }

  /**
   * Delete notification (soft delete)
   */
  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    const notification = await this.getNotificationById(notificationId, userId);

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get notification statistics for user
   */
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const [total, unread, byType, recent] = await Promise.all([
      this.prisma.notification.count({
        where: { userId, deletedAt: null },
      }),
      this.prisma.notification.count({
        where: { userId, read: false, deletedAt: null },
      }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { userId, deletedAt: null },
        _count: { type: true },
      }),
      this.prisma.notification.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const typeStats = byType.reduce(
      (acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total,
      unread,
      byType: typeStats,
      recent,
    };
  }

  /**
   * Send real-time notification via WebSocket
   */
  private async sendRealTimeNotification(
    userId: string,
    notification: NotificationResponse,
  ): Promise<void> {
    try {
      // Real-time notification will be handled by the gateway when integrated
      this.logger.log(
        `Would send real-time notification to user ${userId}: ${notification.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send real-time notification to user ${userId}:`,
        error,
      );
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    notification: NotificationResponse,
  ): Promise<void> {
    try {
      const user = notification.user;
      if (!user || !user.email) return;

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      await this.mailService.sendCustomEmail(
        user.email,
        `CareerBridge Notification: ${notification.title}`,
        'notification',
        {
          firstName: user.firstName,
          title: notification.title,
          content: notification.content,
          link: notification.link,
          type: notification.type,
          createdAt: notification.createdAt,
          actionUrl: notification.link
            ? `${baseUrl}${notification.link}`
            : `${baseUrl}/notifications`,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to send email notification:`, error);
    }
  }

  /**
   * Create system notification (for admin announcements)
   */
  async createSystemNotification(
    title: string,
    content: string,
    userIds?: string[],
    link?: string,
  ): Promise<NotificationResponse[]> {
    const targetUserIds = userIds || (await this.getAllActiveUserIds());

    return this.createBulkNotifications({
      title,
      content,
      type: NotificationType.SYSTEM,
      link,
      userIds: targetUserIds,
      priority: NotificationPriority.HIGH,
      sendEmail: true,
      sendPush: true,
    });
  }

  /**
   * Create welcome notification for new users
   */
  async createWelcomeNotification(
    userId: string,
  ): Promise<NotificationResponse> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const roleSpecificContent = this.getWelcomeContentByRole(user.role);

    return this.createNotification({
      title: `Welcome to CareerBridge AI, ${user.firstName}! 🎉`,
      content: roleSpecificContent,
      type: NotificationType.WELCOME,
      userId,
      link: this.getDashboardLinkByRole(user.role),
      priority: NotificationPriority.HIGH,
      sendPush: true,
    });
  }

  /**
   * Create job alert notification
   */
  async createJobAlert(
    userId: string,
    jobTitle: string,
    companyName: string,
    jobId: string,
  ): Promise<NotificationResponse> {
    return this.createNotification({
      title: `New Job Alert: ${jobTitle}`,
      content: `A new position at ${companyName} matches your profile. Check it out!`,
      type: NotificationType.JOB_ALERT,
      userId,
      link: `/jobs/${jobId}`,
      priority: NotificationPriority.MEDIUM,
      sendEmail: true,
      sendPush: true,
    });
  }

  /**
   * Get all active user IDs
   */
  private async getAllActiveUserIds(): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        isVerified: true,
        accountStatus: 'ACTIVE',
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  /**
   * Get welcome content based on user role
   */
  private getWelcomeContentByRole(role: UserRole): string {
    const welcomeMessages = {
      STUDENT:
        'Explore job opportunities, connect with alumni, and build your professional network!',
      ALUMNI:
        'Welcome back! Share your experience and help current students succeed.',
      EMPLOYER:
        'Start posting jobs and discover talented candidates from our community.',
      PROFESSOR:
        'Manage your students and create engaging academic experiences.',
      MENTOR:
        'Begin mentoring students and make a lasting impact on their careers.',
      UNIVERSITY_STAFF:
        'Help manage your university community and support student success.',
      ADMIN:
        'Welcome to the admin dashboard. You have full access to platform management.',
      SUPER_ADMIN: 'Welcome, Super Admin. You have complete system control.',
      OTHER:
        'Welcome to CareerBridge AI! Explore all the features available to you.',
    };

    return welcomeMessages[role] || welcomeMessages.OTHER;
  }

  /**
   * Get dashboard link based on user role
   */
  private getDashboardLinkByRole(role: UserRole): string {
    const dashboardLinks = {
      STUDENT: '/dashboard/student',
      ALUMNI: '/dashboard/student',
      EMPLOYER: '/dashboard/employer',
      PROFESSOR: '/dashboard/university',
      MENTOR: '/dashboard/mentor',
      UNIVERSITY_STAFF: '/dashboard/university',
      ADMIN: '/dashboard/admin',
      SUPER_ADMIN: '/dashboard/admin',
      OTHER: '/dashboard',
    };

    return dashboardLinks[role] || '/dashboard';
  }
}
