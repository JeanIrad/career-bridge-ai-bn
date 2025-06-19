import { Injectable, NotFoundException } from '@nestjs/common';

import { AddGroupMembersDto, CreateChatGroupDto } from './dto/chat-group.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async saveMessage({
    content,
    senderId,
    recipientId,
    groupId,
  }: {
    content: string;
    senderId: string;
    recipientId?: string | null;
    groupId?: string | null;
  }) {
    console.log('senderId', senderId);
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });
    if (!sender) throw new NotFoundException('Sender not found');

    let recipient;
    if (recipientId) {
      recipient = await this.prisma.user.findUnique({
        where: { id: recipientId },
      });
      if (!recipient) throw new NotFoundException('Recipient not Found');
    }

    let group;
    if (groupId) {
      group = await this.prisma.chatGroup.findUnique({
        where: {
          id: groupId,
          deletedAt: null, // Only find active groups
        },
      });
      if (!group) throw new NotFoundException('Group not found');
    }

    if (groupId) {
      // Create group message
      return await this.prisma.groupMessage.create({
        data: {
          content,
          senderId,
          groupId,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          group: true,
        },
      });
    } else if (recipientId) {
      // For direct messages, we need to create or find a chat first
      // This is a simplified approach - you might want to implement proper chat management
      let chat = await this.prisma.chat.findFirst({
        where: {
          participants: {
            hasEvery: [senderId, recipientId],
          },
        },
      });

      if (!chat) {
        chat = await this.prisma.chat.create({
          data: {
            type: 'direct',
            participants: [senderId, recipientId],
            userId: senderId,
          },
        });
      }

      return await this.prisma.message.create({
        data: {
          content,
          senderId,
          chatId: chat.id,
        },
        include: {
          sender: {
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
  }

  async getMessagesForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found'); // Fixed: was throwing if user exists

    // Get messages from chats where user is a participant
    const chats = await this.prisma.chat.findMany({
      where: {
        participants: {
          has: userId,
        },
      },
    });

    const chatIds = chats.map((chat) => chat.id);

    return await this.prisma.message.findMany({
      where: {
        chatId: { in: chatIds },
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getMessagesForGroup(groupId: string) {
    const group = await this.prisma.chatGroup.findUnique({
      where: {
        id: groupId,
        deletedAt: null, // Only find active groups
      },
    });
    if (!group) throw new NotFoundException('Group not found');

    return await this.prisma.groupMessage.findMany({
      where: { groupId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMembersToGroup(dto: AddGroupMembersDto, groupId: string) {
    const group = await this.prisma.chatGroup.findUnique({
      where: {
        id: groupId,
        deletedAt: null, // Only find active groups
      },
      include: { members: true },
    });
    if (!group) throw new NotFoundException('Group not found');

    // Verify all new members exist
    const newMembers = await this.prisma.user.findMany({
      where: {
        id: { in: dto.memberIds },
      },
    });

    if (newMembers.length !== dto.memberIds.length) {
      throw new NotFoundException('Some members not found');
    }

    // Get current member IDs
    const currentMemberIds = group.members.map((member) => member.id);

    // Filter out members who are already in the group
    const membersToAdd = newMembers.filter(
      (member) => !currentMemberIds.includes(member.id),
    );

    if (membersToAdd.length === 0) {
      return group; // No new members to add
    }

    // Update the group with new members
    return await this.prisma.chatGroup.update({
      where: { id: groupId },
      data: {
        members: {
          connect: membersToAdd.map((member) => ({ id: member.id })),
        },
        updatedAt: new Date(),
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
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

  async createGroup(dto: CreateChatGroupDto, ownerId: string) {
    console.log('DTO', dto, ownerId);
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
    });
    if (!owner) throw new NotFoundException('Owner not found');

    let memberIds: string[] = [];

    if (dto.members && dto.members.length > 0) {
      // Verify all members exist
      const members = await this.prisma.user.findMany({
        where: {
          id: { in: dto.members },
        },
      });

      if (members.length !== dto.members.length) {
        console.warn('Some members not found');
      }

      memberIds = members.map((member) => member.id);
    }

    // Always include owner as a member
    const allMemberIds = Array.from(new Set([ownerId, ...memberIds]));

    const group = await this.prisma.chatGroup.create({
      data: {
        name: dto.name,
        description: dto.description,
        ownerId,
        members: {
          connect: allMemberIds.map((id) => ({ id })),
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return group;
  }

  async getUserGroups(userId: string) {
    return await this.prisma.chatGroup.findMany({
      where: {
        AND: [
          { deletedAt: null }, // Only active groups
          {
            OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async deleteGroup(groupId: string, userId: string) {
    const group = await this.prisma.chatGroup.findUnique({
      where: {
        id: groupId,
        deletedAt: null,
      },
    });

    if (!group) throw new NotFoundException('Group not found');
    if (group.ownerId !== userId) {
      throw new NotFoundException('Only group owner can delete the group');
    }

    // Soft delete
    return await this.prisma.chatGroup.update({
      where: { id: groupId },
      data: { deletedAt: new Date() },
    });
  }

  async leaveGroup(groupId: string, userId: string) {
    const group = await this.prisma.chatGroup.findUnique({
      where: {
        id: groupId,
        deletedAt: null, // Only find active groups
      },
      include: { members: true },
    });
    if (!group) throw new NotFoundException('Group not found');

    // Check if user is a member
    const isMember = group.members.some((member) => member.id === userId);
    if (!isMember) {
      throw new NotFoundException('User is not a member of this group');
    }

    // Remove user from group
    await this.prisma.chatGroup.update({
      where: { id: groupId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
    });

    // If the user is the owner and there are other members, transfer ownership
    if (group.ownerId === userId && group.members.length > 1) {
      const newOwner = group.members.find((member) => member.id !== userId);
      if (newOwner) {
        await this.prisma.chatGroup.update({
          where: { id: groupId },
          data: { ownerId: newOwner.id },
        });
      }
    }

    // If no members left or owner leaves and no one to transfer to, soft delete
    if (
      group.members.length === 1 ||
      (group.ownerId === userId && group.members.length === 1)
    ) {
      await this.prisma.chatGroup.update({
        where: { id: groupId },
        data: { deletedAt: new Date() },
      });
    }

    return { message: 'Successfully left the group' };
  }

  // New methods for the gateway
  async getGroupMessages(
    groupId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const group = await this.prisma.chatGroup.findUnique({
      where: {
        id: groupId,
        deletedAt: null,
      },
    });
    if (!group) throw new NotFoundException('Group not found');

    return await this.prisma.groupMessage.findMany({
      where: { groupId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getDirectMessages(
    userId: string,
    targetUserId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    // Find the chat between these two users
    const chat = await this.prisma.chat.findFirst({
      where: {
        participants: {
          hasEvery: [userId, targetUserId],
        },
        type: 'direct',
      },
    });

    if (!chat) {
      return []; // No conversation yet
    }

    return await this.prisma.message.findMany({
      where: { chatId: chat.id },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async markMessagesAsRead(userId: string, messageIds: string[]) {
    // For group messages, we might need a separate read status table
    // For now, let's implement a simple version
    // This is a placeholder - you might want to create a MessageReadStatus model

    // For now, we'll just return the count without actually updating read status
    // since we don't have read status fields in the current schema
    const groupMessages = await this.prisma.groupMessage.findMany({
      where: {
        id: { in: messageIds },
        senderId: { not: userId },
      },
    });

    const directMessages = await this.prisma.message.findMany({
      where: {
        id: { in: messageIds },
        senderId: { not: userId },
      },
    });

    // TODO: Implement proper read status tracking
    // You might want to create a MessageReadStatus model or add readBy fields

    return {
      groupMessagesUpdated: groupMessages.length,
      directMessagesUpdated: directMessages.length,
      message: 'Read status tracking not fully implemented yet',
    };
  }

  async removeUserFromGroup(groupId: string, userId: string) {
    return await this.leaveGroup(groupId, userId);
  }
}
