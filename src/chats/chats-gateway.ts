import { BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from './chats.service';

@WebSocketGateway({
  path: '/api/chats/socket.io',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGatway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGatway.name);

  constructor(
    private readonly jwtService: JwtService,
    private chatService: ChatsService,
  ) {}

  @WebSocketServer()
  server: Server;

  private usersMap = new Map<string, string>();

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`🔌 CONNECTION ATTEMPT from client: ${client.id}`);

      // Try to get token from multiple sources
      let token: string | null = null;

      // 1. Try authorization header first
      const authHeader = client.handshake?.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        this.logger.log(`🔑 Token found in Authorization header`);
      }

      // 2. Try query parameters
      if (!token && client.handshake?.query?.token) {
        token = client.handshake.query.token as string;
        this.logger.log(`🔑 Token found in query parameters`);
      }

      // 3. Try auth object
      if (!token && client.handshake?.auth?.token) {
        token = client.handshake.auth.token as string;
        this.logger.log(`🔑 Token found in auth object`);
      }

      this.logger.log(`🔑 Token status:`, token ? 'Present' : 'Missing');
      this.logger.log(`🔍 Handshake query:`, client.handshake?.query);
      this.logger.log(`🔍 Handshake auth:`, client.handshake?.auth);

      if (!token) {
        throw new BadRequestException('No authentication token provided');
      }
      const user = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      client.data.user = user;
      this.usersMap.set(user.id, client.id);

      this.logger.log(`✅ USER CONNECTED:`, {
        userId: user.id,
        socketId: client.id,
        username: user.username,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });

      const groups = await this.chatService.getUserGroups(user.id);
      if (groups) {
        this.logger.log(`🏠 User ${user.id} joining ${groups.length} groups:`);
        groups.forEach((group) => {
          client.join(`group_${group.id}`);
          this.logger.log(`  ✅ Joined group: ${group.id} (${group.name})`);
        });
      }

      this.logger.log(`👥 TOTAL CONNECTED USERS: ${this.usersMap.size}`);
      this.logger.log(
        `📊 Current users map:`,
        Object.fromEntries(this.usersMap),
      );

      // Send connection confirmation to client
      client.emit('connected', {
        userId: user.id,
        socketId: client.id,
        message: 'Successfully connected to chat',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`❌ UNAUTHORIZED CONNECTION: ${error.message}`);
      client.emit('error', {
        message: 'Authentication failed',
        type: 'AUTH_ERROR',
        details: error.message,
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data?.user;
    if (user) {
      this.usersMap.delete(user.id);
      this.logger.log(`User ${user.id} disconnected from socket ${client.id}`);
    } else {
      this.logger.log(`Unknown client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('joinGroup')
  handleJoinGroup(
    @MessageBody() data: { groupId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!data || !data.groupId) {
        throw new WsException('Invalid group data');
      }

      client.join(`group_${data.groupId}`);
      this.logger.log(`Client ${client.id} joined group ${data.groupId}`);
    } catch (error) {
      this.logger.error(`Error joining group: ${error.message}`);
      client.emit('error', { message: 'Failed to join group' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    data: { content: string; groupId?: string; targetUserId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.log(
        `🔥 RECEIVED MESSAGE from ${client.id}:`,
        JSON.stringify(data),
      );

      const user = client.data.user;
      if (!user) {
        throw new WsException('User not authenticated');
      }

      this.logger.log(`👤 Authenticated user:`, {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
      });

      // Validate message data
      if (!data || typeof data !== 'object') {
        throw new WsException('Invalid message format');
      }

      // Handle different message formats
      let messageData: {
        content: string;
        groupId?: string;
        targetUserId?: string;
      };

      if (typeof data === 'string') {
        // If it's a plain string, treat it as content
        messageData = { content: data };
      } else if (data.content || data.groupId || data.targetUserId) {
        // If it's already an object with expected properties
        messageData = data;
      } else {
        throw new WsException(
          'Message must have content, groupId, or targetUserId',
        );
      }

      if (!messageData.content) {
        throw new WsException('Message content is required');
      }

      this.logger.log(
        `📝 Processed message data:`,
        JSON.stringify(messageData),
      );

      if (messageData.groupId) {
        this.logger.log(`🏠 GROUP MESSAGE - Group ID: ${messageData.groupId}`);

        // Group message
        const savedMessage = await this.chatService.saveMessage({
          content: messageData.content,
          senderId: user.id,
          groupId: messageData.groupId,
        });

        this.logger.log(`💾 Message saved to DB:`, {
          messageId: savedMessage?.id,
        });

        // Check who's in the group room
        const room = this.server.sockets.adapter.rooms.get(
          `group_${messageData.groupId}`,
        );
        this.logger.log(
          `🏠 Room group_${messageData.groupId} has ${room?.size || 0} members:`,
          Array.from(room || []),
        );

        const messagePayload = {
          sender:
            user?.firstName + ' ' + user?.lastName ||
            user?.username ||
            user?.email,
          content: messageData.content,
          timestamp: new Date().toISOString(),
          senderId: user.id,
          messageId: savedMessage?.id,
        };

        this.logger.log(
          `📤 Emitting to group_${messageData.groupId}:`,
          messagePayload,
        );

        this.server
          .to(`group_${messageData.groupId}`)
          .emit('receiveGroupMessage', messagePayload);

        // Also emit to sender for confirmation
        client.emit('messageSent', {
          status: 'success',
          messageId: savedMessage?.id,
          groupId: messageData.groupId,
        });

        this.logger.log(
          `✅ Group message sent to group ${messageData.groupId}`,
        );
      } else if (messageData.targetUserId) {
        this.logger.log(
          `👥 DIRECT MESSAGE - Target User ID: ${messageData.targetUserId}`,
        );

        // One-on-one message
        const targetSocketId = this.getSocketIdByUserId(
          messageData.targetUserId,
        );

        this.logger.log(
          `🔍 Looking for target user ${messageData.targetUserId}:`,
        );
        this.logger.log(`📍 Target socket ID: ${targetSocketId}`);
        this.logger.log(
          `👥 Current users map:`,
          Object.fromEntries(this.usersMap),
        );

        const savedMessage = await this.chatService.saveMessage({
          content: messageData.content,
          senderId: user.id,
          recipientId: messageData.targetUserId,
        });

        this.logger.log(`💾 Direct message saved to DB:`, {
          messageId: savedMessage?.id,
        });

        if (targetSocketId) {
          const messagePayload = {
            content: messageData.content,
            timestamp: new Date().toISOString(),
            senderId: user.id,
            recipientId: messageData.targetUserId,
            messageId: savedMessage?.id,
            status: 'delivered',
            isOwn: false,
            sender: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar,
              email: user.email,
              name: user.firstName + ' ' + user.lastName,
            },
          };

          this.logger.log(
            `📤 Emitting to socket ${targetSocketId}:`,
            messagePayload,
          );

          this.server.to(targetSocketId).emit('receiveMessage', messagePayload);

          // Also emit to sender for confirmation with isOwn=true
          const senderPayload = {
            ...messagePayload,
            isOwn: true,
            status: 'delivered',
          };
          client.emit('receiveMessage', senderPayload);

          // Send delivery confirmation
          client.emit('messageSent', {
            status: 'delivered',
            messageId: savedMessage?.id,
            targetUserId: messageData.targetUserId,
          });

          this.logger.log(
            `✅ Direct message sent to user ${messageData.targetUserId}`,
          );
        } else {
          this.logger.warn(
            `⚠️ Target user ${messageData.targetUserId} is offline or not found`,
          );

          client.emit('messageStatus', {
            status: 'saved',
            message: 'User is offline, message saved',
            messageId: savedMessage?.id,
          });
        }
      } else {
        throw new WsException(
          'Message must specify either groupId or targetUserId',
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Error handling message: ${error.message}`,
        error.stack,
      );
      client.emit('error', {
        message: error.message || 'Failed to send message',
        type: 'MESSAGE_ERROR',
        details: error.stack,
      });
    }
  }

  @SubscribeMessage('createGroup')
  async handleCreateGroup(
    @MessageBody()
    data: {
      name: string;
      description?: string;
      memberIds: string[];
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      if (!user) {
        throw new WsException('User not authenticated');
      }

      this.logger.log(`Creating group request from ${client.id}:`, data);

      // Validate group data
      if (!data || typeof data !== 'object') {
        throw new WsException('Invalid group data format');
      }

      // Handle different data formats
      let groupData: {
        name: string;
        description?: string;
        memberIds: string[];
      };

      if (typeof data === 'string') {
        try {
          groupData = JSON.parse(data);
        } catch {
          throw new WsException('Invalid JSON format for group data');
        }
      } else {
        groupData = data;
      }

      if (
        !groupData.name ||
        !groupData.memberIds ||
        !Array.isArray(groupData.memberIds)
      ) {
        throw new WsException('Group name and memberIds are required');
      }

      const group = await this.chatService.createGroup(
        {
          name: groupData.name,
          members: groupData.memberIds,
          description: groupData.description || '',
        },
        user.id,
      );

      // Join the creator to the group
      client.join(`group_${group.id}`);

      // Add members to the group
      group.members.forEach((member) => {
        const memberSocketId = this.getSocketIdByUserId(member.id);
        if (memberSocketId) {
          const memberSocket =
            this.server.sockets?.sockets?.get(memberSocketId);
          memberSocket?.join(`group_${group.id}`);
          this.logger.log(`Added member ${member.id} to group ${group.id}`);
        } else {
          this.logger.warn(`Member ${member.id} is offline`);
        }
      });

      this.server.to(`group_${group.id}`).emit('groupCreated', {
        ...group,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Group ${group.id} created successfully`);
    } catch (error) {
      this.logger.error(`Error creating group: ${error.message}`, error.stack);
      client.emit('error', {
        message: error.message || 'Failed to create group',
        type: 'GROUP_CREATION_ERROR',
      });
    }
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(
    @MessageBody()
    data: {
      conversationId: string;
      limit?: number;
      offset?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      if (!user) {
        throw new WsException('User not authenticated');
      }

      this.logger.log(`Getting messages request from ${client.id}:`, data);

      if (!data.conversationId) {
        throw new WsException('conversationId is required');
      }

      let messages;
      if (data.conversationId.startsWith('group_')) {
        // Get group messages
        const groupId = data.conversationId.replace('group_', '');
        messages = await this.chatService.getGroupMessages(
          groupId,
          data.limit || 50,
          data.offset || 0,
        );
      } else if (data.conversationId.startsWith('direct_')) {
        // Get direct messages between two users
        const targetUserId = data.conversationId.replace('direct_', '');
        messages = await this.chatService.getDirectMessages(
          user.id,
          targetUserId,
          data.limit || 50,
          data.offset || 0,
        );
      } else {
        throw new WsException('Invalid conversation ID format');
      }

      client.emit('messagesReceived', {
        messages,
        conversationId: data.conversationId,
        hasMore: messages.length === (data.limit || 50),
      });

      this.logger.log(
        `Sent ${messages.length} messages to client ${client.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error getting messages: ${error.message}`,
        error.stack,
      );
      client.emit('error', {
        message: error.message || 'Failed to get messages',
        type: 'GET_MESSAGES_ERROR',
      });
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { messageIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      if (!user) {
        throw new WsException('User not authenticated');
      }

      if (!data.messageIds || !Array.isArray(data.messageIds)) {
        throw new WsException('messageIds array is required');
      }

      await this.chatService.markMessagesAsRead(user.id, data.messageIds);

      client.emit('messagesMarkedAsRead', {
        messageIds: data.messageIds,
        readAt: new Date().toISOString(),
      });

      this.logger.log(
        `Marked ${data.messageIds.length} messages as read for user ${user.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error marking messages as read: ${error.message}`,
        error.stack,
      );
      client.emit('error', {
        message: error.message || 'Failed to mark messages as read',
        type: 'MARK_READ_ERROR',
      });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody()
    data: { groupId?: string; targetUserId?: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      if (!user) {
        throw new WsException('User not authenticated');
      }

      if (data.groupId) {
        // Typing in group
        client.to(`group_${data.groupId}`).emit('userTyping', {
          userId: user.id,
          username: user.username || user.name,
          isTyping: data.isTyping,
          groupId: data.groupId,
        });
      } else if (data.targetUserId) {
        // Typing in direct message
        const targetSocketId = this.getSocketIdByUserId(data.targetUserId);
        if (targetSocketId) {
          this.server.to(targetSocketId).emit('userTyping', {
            userId: user.id,
            username: user.username || user.name,
            isTyping: data.isTyping,
            fromUserId: user.id,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error handling typing: ${error.message}`);
    }
  }

  @SubscribeMessage('getUsersOnline')
  async handleGetUsersOnline(
    @MessageBody() data: { userIds?: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      if (!user) {
        throw new WsException('User not authenticated');
      }

      const userIds = data.userIds || Array.from(this.usersMap.keys());
      const onlineUsers = userIds.filter((userId) => this.usersMap.has(userId));

      client.emit('onlineUsersReceived', {
        onlineUsers,
        total: onlineUsers.length,
      });

      this.logger.log(`Sent online users list to client ${client.id}`);
    } catch (error) {
      this.logger.error(
        `Error getting online users: ${error.message}`,
        error.stack,
      );
      client.emit('error', {
        message: error.message || 'Failed to get online users',
        type: 'GET_ONLINE_USERS_ERROR',
      });
    }
  }

  @SubscribeMessage('leaveGroup')
  async handleLeaveGroup(
    @MessageBody() data: { groupId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      if (!user) {
        throw new WsException('User not authenticated');
      }

      if (!data.groupId) {
        throw new WsException('groupId is required');
      }

      await this.chatService.removeUserFromGroup(data.groupId, user.id);

      client.leave(`group_${data.groupId}`);

      // Notify other group members
      client.to(`group_${data.groupId}`).emit('userLeftGroup', {
        userId: user.id,
        username: user.username || user.name,
        groupId: data.groupId,
        timestamp: new Date().toISOString(),
      });

      client.emit('leftGroup', {
        groupId: data.groupId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`User ${user.id} left group ${data.groupId}`);
    } catch (error) {
      this.logger.error(`Error leaving group: ${error.message}`, error.stack);
      client.emit('error', {
        message: error.message || 'Failed to leave group',
        type: 'LEAVE_GROUP_ERROR',
      });
    }
  }

  private getSocketIdByUserId(userId: string): string | undefined {
    return this.usersMap.get(userId);
  }
}
