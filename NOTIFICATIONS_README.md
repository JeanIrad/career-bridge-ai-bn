# 📢 CareerBridge AI Notification System

A comprehensive notification system for CareerBridge AI that supports real-time notifications, email notifications, and various notification types across different user roles.

## 🌟 Features

- **Real-time Notifications** - WebSocket-based live notifications
- **Email Notifications** - Professional email templates with role-based content
- **Multiple Notification Types** - System, job alerts, messages, events, security alerts, etc.
- **Priority Levels** - LOW, MEDIUM, HIGH, URGENT priorities
- **Role-based Targeting** - Send notifications to specific user roles
- **Bulk Notifications** - Send to multiple users at once
- **Read Status Tracking** - Mark notifications as read/unread
- **Pagination Support** - Efficient loading of notification history
- **Admin Management** - Full admin control over notifications
- **Email Templates** - Beautiful, responsive email templates

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [WebSocket Events](#websocket-events)
- [Notification Types](#notification-types)
- [Email Templates](#email-templates)
- [Helper Functions](#helper-functions)
- [Database Schema](#database-schema)
- [Integration Examples](#integration-examples)
- [Best Practices](#best-practices)

## 🚀 Quick Start

### 1. Installation

The notification system is already integrated into the main application. No additional installation required.

### 2. Basic Usage

```typescript
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class YourService {
  constructor(private notificationsService: NotificationsService) {}

  async sendJobAlert() {
    await this.notificationsService.createNotification({
      title: 'New Job Alert: Software Developer',
      content: 'A new position at TechCorp matches your profile!',
      type: NotificationType.JOB_ALERT,
      userId: 'user-id',
      link: '/jobs/123',
      priority: NotificationPriority.MEDIUM,
      sendEmail: true,
      sendPush: true,
    });
  }
}
```

### 3. WebSocket Connection (Frontend)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/notifications', {
  auth: {
    token: 'your-jwt-token',
  },
});

socket.on('notification', (data) => {
  console.log('New notification:', data);
  // Update UI with new notification
});
```

## 🔗 API Endpoints

### User Endpoints

| Method   | Endpoint                       | Description                        |
| -------- | ------------------------------ | ---------------------------------- |
| `GET`    | `/notifications`               | Get user notifications (paginated) |
| `GET`    | `/notifications/stats`         | Get notification statistics        |
| `GET`    | `/notifications/:id`           | Get specific notification          |
| `PATCH`  | `/notifications/:id`           | Update notification                |
| `PATCH`  | `/notifications/:id/read`      | Mark notification as read          |
| `PATCH`  | `/notifications/mark-all-read` | Mark all notifications as read     |
| `DELETE` | `/notifications/:id`           | Delete notification                |

### Admin Endpoints

| Method | Endpoint                                   | Description                              |
| ------ | ------------------------------------------ | ---------------------------------------- |
| `POST` | `/notifications`                           | Create notification (Admin only)         |
| `POST` | `/notifications/bulk`                      | Create bulk notifications (Admin only)   |
| `POST` | `/notifications/system`                    | Create system announcement (Admin only)  |
| `GET`  | `/notifications/admin/users/:userId`       | Get user notifications (Admin only)      |
| `GET`  | `/notifications/admin/users/:userId/stats` | Get user notification stats (Admin only) |

### Query Parameters

**GET /notifications**

```
?page=1&limit=20&type=JOB_ALERT&read=false
```

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `type` (string): Filter by notification type
- `read` (boolean): Filter by read status

## 🔌 WebSocket Events

### Client → Server

| Event        | Data               | Description         |
| ------------ | ------------------ | ------------------- |
| `join-room`  | `{ room: string }` | Join specific room  |
| `leave-room` | `{ room: string }` | Leave specific room |

### Server → Client

| Event                 | Data                                                                | Description            |
| --------------------- | ------------------------------------------------------------------- | ---------------------- |
| `connected`           | `{ message: string, userId: string }`                               | Connection established |
| `notification`        | `{ type: string, data: Notification, timestamp: string }`           | New notification       |
| `notification_update` | `{ type: string, data: { notificationId: string, read: boolean } }` | Notification updated   |
| `system_alert`        | `{ type: string, message: string, severity: string }`               | System alert           |

## 📝 Notification Types

```typescript
enum NotificationType {
  SYSTEM = 'SYSTEM', // System announcements
  MESSAGE = 'MESSAGE', // Direct messages
  JOB_ALERT = 'JOB_ALERT', // Job recommendations
  EVENT_REMINDER = 'EVENT_REMINDER', // Event reminders
  CONNECTION_REQUEST = 'CONNECTION_REQUEST', // Network connections
  PROFILE_UPDATE = 'PROFILE_UPDATE', // Profile changes
  SECURITY_ALERT = 'SECURITY_ALERT', // Security issues
  ADMIN_ANNOUNCEMENT = 'ADMIN_ANNOUNCEMENT', // Admin broadcasts
  CHAT_MESSAGE = 'CHAT_MESSAGE', // Chat messages
  DOCUMENT_VERIFICATION = 'DOCUMENT_VERIFICATION', // Document status
  APPLICATION_STATUS = 'APPLICATION_STATUS', // Job application updates
  WELCOME = 'WELCOME', // Welcome messages
  PROMOTION = 'PROMOTION', // Promotional content
}
```

## 📧 Email Templates

### Available Templates

1. **notification.hbs** - General notification template
2. **welcome.hbs** - Welcome email (already exists)
3. **security-alert.hbs** - Security alert template (already exists)

### Template Context

```typescript
{
  firstName: string,
  title: string,
  content: string,
  link?: string,
  type: string,
  createdAt: Date,
  actionUrl: string,
  // ... other context variables
}
```

## 🛠 Helper Functions

### Using Notification Helpers

```typescript
import { NotificationHelpers } from '../notifications/utils/notification-helpers';

// Create job alert
const jobAlert = NotificationHelpers.createJobAlertTemplate(
  'Software Developer',
  'TechCorp',
  'job-123',
);

// Create message notification
const messageNotif = NotificationHelpers.createMessageNotificationTemplate(
  'John Doe',
  'Hey! How are you doing?',
  'chat-456',
);

// Create event reminder
const eventReminder = NotificationHelpers.createEventReminderTemplate(
  'Career Fair 2024',
  new Date('2024-01-15T10:00:00Z'),
  'event-789',
);
```

## 💾 Database Schema

```sql
model Notification {
  id        String   @id @default(uuid())
  title     String
  content   String
  type      String
  priority  String?  @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  link      String?
  metadata  Json?    // Additional data for the notification
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  deletedAt DateTime?
  updatedAt DateTime @updatedAt

  @@index([userId, read])
  @@index([userId, type])
  @@index([createdAt])
}
```

## 🔄 Integration Examples

### 1. Job Application Notification

```typescript
// When user applies for a job
await this.notificationsService.createNotification({
  title: 'Application Submitted',
  content: `Your application for ${jobTitle} at ${companyName} has been submitted.`,
  type: NotificationType.APPLICATION_STATUS,
  userId: applicantId,
  link: `/applications/${jobId}`,
  priority: NotificationPriority.MEDIUM,
  sendEmail: false,
  sendPush: true,
});
```

### 2. System Maintenance Announcement

```typescript
// Notify all users about maintenance
await this.notificationsService.createSystemNotification(
  'Scheduled Maintenance',
  'The platform will be under maintenance on Jan 15, 2024 from 2:00 AM to 4:00 AM EST.',
  null, // Send to all users
  '/maintenance-info',
);
```

### 3. Welcome New User

```typescript
// Automatically called during email verification
await this.notificationsService.createWelcomeNotification(userId);
```

### 4. Security Alert

```typescript
const securityAlert = NotificationHelpers.createSecurityAlertTemplate(
  'Unusual Login Activity',
  'Login detected from new device',
  '192.168.1.1',
  'New York, NY',
);

await this.notificationsService.createNotification({
  ...securityAlert,
  userId: userId,
});
```

## 📊 Statistics and Analytics

### Get User Notification Stats

```typescript
const stats = await this.notificationsService.getNotificationStats(userId);

// Returns:
{
  total: 45,
  unread: 12,
  byType: {
    'JOB_ALERT': 15,
    'MESSAGE': 20,
    'SYSTEM': 10
  },
  recent: [/* 5 most recent notifications */]
}
```

## 🎯 Best Practices

### 1. **Use Appropriate Priorities**

- `URGENT`: Security alerts, critical system issues
- `HIGH`: Application status changes, important announcements
- `MEDIUM`: Job alerts, event reminders, messages
- `LOW`: Promotional content, weekly digests

### 2. **Email Notifications**

- Use sparingly to avoid spam
- Enable for: Security alerts, application status, important announcements
- Disable for: Chat messages, low-priority notifications

### 3. **Real-time Notifications**

- Enable for most notification types
- Provides immediate user feedback
- Enhances user experience

### 4. **Content Guidelines**

- Keep titles under 50 characters
- Keep content under 200 characters for better display
- Use emojis sparingly and appropriately
- Include relevant links for action items

### 5. **Performance Considerations**

- Use bulk operations for multiple users
- Implement pagination for notification lists
- Clean up old notifications periodically
- Use database indexes for efficient queries

## 🔧 Configuration

### Environment Variables

```env
# WebSocket Configuration
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-secret-key

# Database Configuration
DATABASE_URL=your-database-url
```

### WebSocket Namespaces

- `/notifications` - Main notification namespace
- User rooms: `user:${userId}`
- Role rooms: `role:${userRole}`

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Issues**

   - Ensure JWT token is valid
   - Check CORS configuration
   - Verify frontend URL in environment

2. **Email Notifications Not Sending**

   - Check mail service configuration
   - Verify SMTP settings
   - Check email template exists

3. **Database Errors**
   - Run migrations: `npx prisma migrate dev`
   - Check database connection
   - Verify user exists before creating notification

### Debug Mode

Enable debug logging by setting:

```env
LOG_LEVEL=debug
```

## 📈 Future Enhancements

- [ ] Push notifications for mobile apps
- [ ] Notification preferences per user
- [ ] Scheduled notifications
- [ ] Notification analytics dashboard
- [ ] Email digest subscriptions
- [ ] Rich media notifications
- [ ] Notification templates management UI

## 🤝 Contributing

When adding new notification types:

1. Add to `NotificationType` enum
2. Create helper function in `NotificationHelpers`
3. Add email template if needed
4. Update documentation
5. Add tests

## 📞 Support

For issues with the notification system:

1. Check the troubleshooting section
2. Review server logs
3. Test with Postman/API client
4. Contact the development team

---

**Built with ❤️ for CareerBridge AI**
