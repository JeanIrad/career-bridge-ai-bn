import {
  // NotificationType,
  NotificationPriority,
} from '../dto/notification.dto';
import { NotificationType } from '@prisma/client';

export interface NotificationTemplate {
  title: string;
  content: string;
  type: NotificationType;
  priority: NotificationPriority;
  link?: string;
  sendEmail?: boolean;
  sendPush?: boolean;
}

export class NotificationHelpers {
  /**
   * Create a job alert notification template
   */
  static createJobAlertTemplate(
    jobTitle: string,
    companyName: string,
    jobId: string,
  ): NotificationTemplate {
    return {
      title: `New Job Alert: ${jobTitle}`,
      content: `A new position at ${companyName} matches your profile. Check it out!`,
      type: NotificationType.JOB_APPLICATION,
      priority: NotificationPriority.MEDIUM,
      link: `/jobs/${jobId}`,
      sendEmail: true,
      sendPush: true,
    };
  }

  /**
   * Create a message notification template
   */
  static createMessageNotificationTemplate(
    senderName: string,
    messagePreview: string,
    chatId: string,
  ): NotificationTemplate {
    return {
      title: `New message from ${senderName}`,
      content:
        messagePreview.length > 100
          ? `${messagePreview.substring(0, 100)}...`
          : messagePreview,
      type: NotificationType.MESSAGE,
      priority: NotificationPriority.MEDIUM,
      link: `/messages/${chatId}`,
      sendEmail: false,
      sendPush: true,
    };
  }

  /**
   * Create an event reminder notification template
   */
  static createEventReminderTemplate(
    eventTitle: string,
    eventDate: Date,
    eventId: string,
  ): NotificationTemplate {
    const timeUntilEvent = this.getTimeUntilEvent(eventDate);

    return {
      title: `Event Reminder: ${eventTitle}`,
      content: `Your registered event "${eventTitle}" starts ${timeUntilEvent}. Don't miss it!`,
      type: NotificationType.EVENT_REGISTRATION,
      priority: NotificationPriority.HIGH,
      link: `/events/${eventId}`,
      sendEmail: true,
      sendPush: true,
    };
  }

  /**
   * Create a connection request notification template
   */
  static createConnectionRequestTemplate(
    requesterName: string,
    requesterRole: string,
    requestId: string,
  ): NotificationTemplate {
    return {
      title: `New Connection Request`,
      content: `${requesterName} (${requesterRole}) wants to connect with you.`,
      type: NotificationType.ALERT,
      priority: NotificationPriority.MEDIUM,
      link: `/connections/requests`,
      sendEmail: false,
      sendPush: true,
    };
  }

  /**
   * Create a document verification notification template
   */
  static createDocumentVerificationTemplate(
    documentType: string,
    status: 'approved' | 'rejected' | 'requires_resubmission',
    notes?: string,
  ): NotificationTemplate {
    const statusMessages = {
      approved: {
        title: `Document Approved: ${documentType}`,
        content: `Your ${documentType} has been successfully verified and approved.`,
        priority: NotificationPriority.MEDIUM,
      },
      rejected: {
        title: `Document Rejected: ${documentType}`,
        content: `Your ${documentType} has been rejected. ${notes ? `Reason: ${notes}` : 'Please contact support for details.'}`,
        priority: NotificationPriority.HIGH,
      },
      requires_resubmission: {
        title: `Document Requires Resubmission: ${documentType}`,
        content: `Your ${documentType} requires resubmission. ${notes ? `Notes: ${notes}` : 'Please review and resubmit.'}`,
        priority: NotificationPriority.HIGH,
      },
    };

    const statusData = statusMessages[status];

    return {
      title: statusData.title,
      content: statusData.content,
      type: NotificationType.COMPANY_VERIFICATION,
      priority: statusData.priority,
      link: '/profile/documents',
      sendEmail: true,
      sendPush: true,
    };
  }

  /**
   * Create an application status notification template
   */
  static createApplicationStatusTemplate(
    jobTitle: string,
    companyName: string,
    status: 'accepted' | 'rejected' | 'reviewed' | 'pending',
    jobId: string,
  ): NotificationTemplate {
    const statusMessages = {
      accepted: {
        title: `Application Accepted! 🎉`,
        content: `Congratulations! Your application for ${jobTitle} at ${companyName} has been accepted.`,
        priority: NotificationPriority.HIGH,
      },
      rejected: {
        title: `Application Update`,
        content: `Your application for ${jobTitle} at ${companyName} was not selected this time. Keep applying!`,
        priority: NotificationPriority.MEDIUM,
      },
      reviewed: {
        title: `Application Under Review`,
        content: `Your application for ${jobTitle} at ${companyName} is now under review.`,
        priority: NotificationPriority.MEDIUM,
      },
      pending: {
        title: `Application Received`,
        content: `Your application for ${jobTitle} at ${companyName} has been received and is pending review.`,
        priority: NotificationPriority.LOW,
      },
    };

    const statusData = statusMessages[status];

    return {
      title: statusData.title,
      content: statusData.content,
      type: NotificationType.JOB_APPLICATION,
      priority: statusData.priority,
      link: `/applications/${jobId}`,
      sendEmail: status === 'accepted' || status === 'rejected',
      sendPush: true,
    };
  }

  /**
   * Create a security alert notification template
   */
  static createSecurityAlertTemplate(
    alertType: string,
    details: string,
    ipAddress?: string,
    location?: string,
  ): NotificationTemplate {
    let content = details;
    if (ipAddress || location) {
      content += ` (${ipAddress ? `IP: ${ipAddress}` : ''}${ipAddress && location ? ', ' : ''}${location ? `Location: ${location}` : ''})`;
    }

    return {
      title: `Security Alert: ${alertType}`,
      content,
      type: NotificationType.ALERT,
      priority: NotificationPriority.URGENT,
      link: '/settings/security',
      sendEmail: true,
      sendPush: true,
    };
  }

  /**
   * Create a system announcement notification template
   */
  static createSystemAnnouncementTemplate(
    title: string,
    content: string,
    link?: string,
  ): NotificationTemplate {
    return {
      title: `📢 ${title}`,
      content,
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.HIGH,
      link: link || '/announcements',
      sendEmail: true,
      sendPush: true,
    };
  }

  /**
   * Create a promotion notification template
   */
  static createPromotionTemplate(
    title: string,
    content: string,
    link?: string,
  ): NotificationTemplate {
    return {
      title: `🎯 ${title}`,
      content,
      type: NotificationType.JOB_APPLICATION,
      priority: NotificationPriority.LOW,
      link: link || '/promotions',
      sendEmail: false,
      sendPush: true,
    };
  }

  /**
   * Get human-readable time until event
   */
  private static getTimeUntilEvent(eventDate: Date): string {
    const now = new Date();
    const diffInHours = Math.ceil(
      (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
      return 'in less than an hour';
    } else if (diffInHours < 24) {
      return `in ${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.ceil(diffInHours / 24);
      return `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
    }
  }

  /**
   * Get notification icon based on type
   */
  static getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      [NotificationType.SYSTEM]: '⚙️',
      [NotificationType.MESSAGE]: '💬',
      [NotificationType.JOB_APPLICATION]: '💼',
      [NotificationType.EVENT_REGISTRATION]: '📅',
      [NotificationType.GENERAL]: '📢',
      [NotificationType.REMINDER]: '🔔',
      [NotificationType.ALERT]: '🚨',
      [NotificationType.WELCOME]: '🎉',
      [NotificationType.COMPANY_VERIFICATION]: '📋',
    };

    return icons[type] || '📢';
  }

  /**
   * Get notification color based on priority
   */
  static getNotificationColor(priority: NotificationPriority): string {
    const colors: Record<NotificationPriority, string> = {
      [NotificationPriority.LOW]: '#6B7280', // gray
      [NotificationPriority.MEDIUM]: '#3B82F6', // blue
      [NotificationPriority.HIGH]: '#F59E0B', // amber
      [NotificationPriority.URGENT]: '#EF4444', // red
    };

    return colors[priority] || colors[NotificationPriority.MEDIUM];
  }
}
