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

  @Post('messages')
  @ApiOperation({ summary: 'Send a message to user or group' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - either recipientId or groupId must be provided',
  })
  @ApiResponse({
    status: 404,
    description: 'Recipient or group not found',
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

  @Get('messages')
  @ApiOperation({ summary: 'Get all messages for current user' })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
  })
  async getUserMessages(@CurrentUser() user: any) {
    const messages = await this.chatsService.getMessagesForUser(user.id);
    return {
      success: true,
      data: messages,
    };
  }

  @Get('groups/:groupId/messages')
  @ApiOperation({ summary: 'Get all messages for a specific group' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Group messages retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async getGroupMessages(
    @Param('groupId') groupId: string,
    @CurrentUser() user: any,
  ) {
    const messages = await this.chatsService.getMessagesForGroup(groupId);
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
  @ApiResponse({
    status: 400,
    description: 'Bad request',
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

  @Get('groups')
  @ApiOperation({ summary: 'Get all groups for current user' })
  @ApiResponse({
    status: 200,
    description: 'Groups retrieved successfully',
  })
  async getUserGroups(@CurrentUser() user: any) {
    const groups = await this.chatsService.getUserGroups(user.id);
    return {
      success: true,
      data: groups,
    };
  }

  @Patch('groups/:groupId/members')
  @ApiOperation({ summary: 'Add members to a group' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Members added successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
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
  @ApiResponse({
    status: 404,
    description: 'Group not found or user not a member',
  })
  @ApiResponse({
    status: 400,
    description: 'Owner cannot leave the group',
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
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Only group owner can delete the group',
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

  @Get('groups/:groupId')
  @ApiOperation({ summary: 'Get group details' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({
    status: 200,
    description: 'Group details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async getGroupDetails(
    @Param('groupId') groupId: string,
    @CurrentUser() user: any,
  ) {
    // We can reuse the existing logic by getting user groups and filtering
    const userGroups = await this.chatsService.getUserGroups(user.id);
    const group = userGroups.find((g) => g.id === groupId);

    if (!group) {
      throw new BadRequestException('Group not found or you are not a member');
    }

    return {
      success: true,
      data: group,
    };
  }
}
