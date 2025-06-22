import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatsService } from './chats.service';
import {
  CreateChatGroupDto,
  AddGroupMembersDto,
  SendMessageDto,
  LeaveGroupDto,
} from './dto/chat-group.dto';

@ApiTags('chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all messages and conversations for current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages and conversations retrieved successfully',
  })
  async getUserConversations(@CurrentUser() user: any) {
    console.log(`📞 Getting conversations for user: ${user.id}`);

    const [messages, groups] = await Promise.all([
      this.chatsService.getMessagesForUser(user.id),
      this.chatsService.getUserGroups(user.id),
    ]);

    console.log(
      `📨 Found ${messages.length} messages and ${groups.length} groups for user ${user.id}`,
    );

    // Process messages to create conversations
    const conversations = await this.chatsService.processConversations(
      messages,
      groups,
      user.id,
    );

    console.log(
      `💬 Processed ${conversations.length} conversations for user ${user.id}`,
    );

    return {
      success: true,
      data: {
        conversations,
        messages,
        groups,
      },
    };
  }

  @Post()
  @ApiOperation({ summary: 'Send a message to user or group' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - either recipientId or groupId must be provided',
  })
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @CurrentUser() user: any,
  ) {
    if (!sendMessageDto.recipientId && !sendMessageDto.groupId) {
      throw new BadRequestException(
        'Either recipientId or groupId must be provided',
      );
    }

    if (sendMessageDto.recipientId && sendMessageDto.groupId) {
      throw new BadRequestException(
        'Cannot send message to both recipient and group simultaneously',
      );
    }

    const message = await this.chatsService.saveMessage({
      content: sendMessageDto.content,
      senderId: user.id,
      recipientId: sendMessageDto.recipientId,
      groupId: sendMessageDto.groupId,
    });

    return {
      success: true,
      message: 'Message sent successfully',
      data: message,
    };
  }

  @Get(':conversationId')
  @ApiOperation({ summary: 'Get messages for a specific conversation' })
  @ApiParam({
    name: 'conversationId',
    description:
      'Conversation ID (user ID for direct messages, group ID for groups)',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
  })
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
    @Query('limit') limitStr = '50',
    @Query('offset') offsetStr = '0',
  ) {
    const limit = parseInt(limitStr, 10) || 50;
    const offset = parseInt(offsetStr, 10) || 0;
    console.log(`📥 Getting messages for conversation: ${conversationId}`);

    let messages;
    if (conversationId.startsWith('group_')) {
      const groupId = conversationId.replace('group_', '');
      console.log(`🏠 Fetching group messages for group: ${groupId}`);
      messages = await this.chatsService.getGroupMessages(
        groupId,
        limit,
        offset,
      );
    } else if (conversationId.startsWith('direct_')) {
      // Handle direct messages with "direct_" prefix
      const targetUserId = conversationId.replace('direct_', '');
      console.log(
        `👥 Fetching direct messages between ${user.id} and ${targetUserId}`,
      );
      messages = await this.chatsService.getDirectMessages(
        user.id,
        targetUserId,
        limit,
        offset,
      );
    } else {
      // Handle direct messages without prefix (legacy support)
      console.log(
        `👥 Fetching direct messages between ${user.id} and ${conversationId}`,
      );
      messages = await this.chatsService.getDirectMessages(
        user.id,
        conversationId,
        limit,
        offset,
      );
    }

    console.log(
      `📨 Found ${messages.length} messages for conversation ${conversationId}`,
    );

    return {
      success: true,
      data: messages,
    };
  }

  @Post('groups')
  @ApiOperation({ summary: 'Create a new chat group' })
  @ApiResponse({
    status: 201,
    description: 'Group created successfully',
  })
  async createGroup(
    @Body() createChatGroupDto: CreateChatGroupDto,
    @CurrentUser() user: any,
  ) {
    const group = await this.chatsService.createGroup(
      createChatGroupDto,
      user.id,
    );
    return {
      success: true,
      message: 'Group created successfully',
      data: group,
    };
  }

  @Get('groups/:groupId')
  @ApiOperation({ summary: 'Get group details' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Group details retrieved successfully',
  })
  async getGroupDetails(
    @Param('groupId') groupId: string,
    @CurrentUser() user: any,
  ) {
    const group = await this.chatsService.getGroupDetails(groupId, user.id);
    return {
      success: true,
      data: group,
    };
  }

  @Patch('groups/:groupId/members')
  @ApiOperation({ summary: 'Add members to a group' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Members added successfully',
  })
  async addMembersToGroup(
    @Param('groupId') groupId: string,
    @Body() addGroupMembersDto: AddGroupMembersDto,
    @CurrentUser() user: any,
  ) {
    const group = await this.chatsService.addMembersToGroup(
      addGroupMembersDto,
      groupId,
    );
    return {
      success: true,
      message: 'Members added successfully',
      data: group,
    };
  }

  @Post('groups/:groupId/leave')
  @ApiOperation({ summary: 'Leave a group' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully left the group',
  })
  @HttpCode(HttpStatus.OK)
  async leaveGroup(
    @Param('groupId') groupId: string,
    @CurrentUser() user: any,
  ) {
    const group = await this.chatsService.leaveGroup(groupId, user.id);
    return {
      success: true,
      message: 'Successfully left the group',
      data: group,
    };
  }

  @Delete('groups/:groupId')
  @ApiOperation({ summary: 'Delete a group (owner only)' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Group deleted successfully',
  })
  async deleteGroup(
    @Param('groupId') groupId: string,
    @CurrentUser() user: any,
  ) {
    await this.chatsService.deleteGroup(groupId, user.id);
    return {
      success: true,
      message: 'Group deleted successfully',
    };
  }
}
