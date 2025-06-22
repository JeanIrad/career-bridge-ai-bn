import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationResponse } from './notifications.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'api/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private jwtService: JwtService) {}

  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.id;
      client.userRole = payload.role;

      // Store the connection
      this.connectedUsers.set(payload.id, client.id);

      // Join user to their personal room
      client.join(`user:${payload.id}`);

      // Join role-based rooms for broadcasting
      client.join(`role:${payload.role}`);

      this.logger.log(`User ${payload.id} connected to notifications`);

      // Send welcome message
      client.emit('connected', {
        message: 'Connected to notification service',
        userId: payload.id,
      });
    } catch (error) {
      this.logger.error('Authentication failed for socket connection:', error);
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userId} disconnected from notifications`);
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    if (client.userId) {
      client.join(data.room);
      this.logger.log(`User ${client.userId} joined room: ${data.room}`);
    }
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    if (client.userId) {
      client.leave(data.room);
      this.logger.log(`User ${client.userId} left room: ${data.room}`);
    }
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId: string, notification: NotificationResponse) {
    this.server.to(`user:${userId}`).emit('notification', {
      type: 'new_notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Sent notification to user ${userId}: ${notification.title}`,
    );
  }

  /**
   * Send notification to all users with specific role
   */
  sendNotificationToRole(role: string, notification: NotificationResponse) {
    this.server.to(`role:${role}`).emit('notification', {
      type: 'role_notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Sent notification to role ${role}: ${notification.title}`);
  }

  /**
   * Broadcast notification to all connected users
   */
  broadcastNotification(notification: NotificationResponse) {
    this.server.emit('notification', {
      type: 'broadcast_notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Broadcasted notification: ${notification.title}`);
  }

  /**
   * Send system alert
   */
  sendSystemAlert(
    message: string,
    severity: 'info' | 'warning' | 'error' = 'info',
  ) {
    this.server.emit('system_alert', {
      type: 'system_alert',
      message,
      severity,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Sent system alert: ${message}`);
  }

  /**
   * Send notification read status update
   */
  sendNotificationUpdate(
    userId: string,
    notificationId: string,
    read: boolean,
  ) {
    this.server.to(`user:${userId}`).emit('notification_update', {
      type: 'notification_update',
      data: {
        notificationId,
        read,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users
   */
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
