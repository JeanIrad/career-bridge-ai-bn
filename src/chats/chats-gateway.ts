import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from './chats.service';

@WebSocketGateway({
  namespace: '/api/chats',
  cors: {
    origin: '*',
  },
})
export class ChatGatway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly jwtService: JwtService,
    private chatService: ChatsService,
  ) {}

  @WebSocketServer()
  server: Server;

  private usersMap = new Map<string, string>();

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake?.headers?.authorization;
      console.log('Auth Header', authHeader);
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new BadRequestException('No or Invalid Authorization Header');
      }
      const token = authHeader.split(' ')[1];
      const user = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      client.data.user = user;
      this.usersMap.set(user.id, client.id);
      console.log('USER ID', user);
      console.log(`Client connected: ${client.id}`);
      const groups = await this.chatService.getUserGroups(user.id);
      if (groups) {
        groups.forEach((group) => {
          client.join(`group_${group.id}`);
          console.log(`User ${user.id} joined group: ${group.id}`);
        });
      }
      console.log('Users:', this.usersMap);
      console.log(`Client Connected:  ${client.id}`);
    } catch (error) {
      console.log('Unauthorized connect Attempt', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const user = client.data?.user;
    if (user) {
      this.usersMap.delete(user.id); // Remove from map on disconnect
    }
  }

  @SubscribeMessage('joinGroup')
  handleJoinGroup(
    @MessageBody() { groupId }: { groupId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`group_${groupId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    message: { content: string; groupId?: string; targetUserId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Message:', message);
    const user = client.data.user;
    // @ts-ignore
    const mssg = JSON.parse(message);

    if (message.groupId) {
      await this.chatService.saveMessage({
        content: mssg.content,
        senderId: user.id,
        groupId: mssg.groupId,
      });
      // Group message
      this.server.to(mssg.groupId).emit('receiveGroupMessage', {
        sender: user?.name,
        content: mssg.content,
      });
    } else if (mssg.targetUserId) {
      // One-on-one message (use socket ID)
      console.log('some', mssg.targetUserId);
      const targetSocketId = this.getSocketIdByUserId(mssg.targetUserId);
      console.log('targetSocketId', targetSocketId);
      await this.chatService.saveMessage({
        content: mssg.content,
        senderId: user.id,
        recipientId: mssg.targetUserId,
      });
      if (targetSocketId) {
        this.server.to(targetSocketId).emit('receiveMessage', {
          sender: user.username,
          text: mssg.content,
        });
      }
    }
  }

  @SubscribeMessage('createGroup')
  async handleCreateGroup(
    @MessageBody()
    data: {
      name: string;
      description: string;
      // ownerId?: string;
      memberIds: string[];
    },
    @ConnectedSocket() client: Socket,
  ) {
    const ownerId = client.data.user.id;
    // @ts-ignore
    const dataa = JSON.parse(data);
    console.log('DAAATTTAA', dataa);
    const group = await this.chatService.createGroup(
      {
        name: dataa.name,
        members: dataa.memberIds,
        description: dataa.description,
      },
      ownerId,
    );
    client.join(`group_${group.id}`);
    group.members.forEach((member) => {
      const socketMemberId = this.getSocketIdByUserId(member.id);
      if (socketMemberId) {
        const memberSocket = this.server.sockets?.sockets?.get(member.id);

        memberSocket?.join(`group_${group.id}`);
      } else {
        console.log(`User ${member.id} is offline`);
      }
    });
    this.server.to(`group_${group.id}`).emit('groupCreated', group);
  }

  private getSocketIdByUserId(userId: string): string | undefined {
    return this.usersMap.get(userId);
  }
}
