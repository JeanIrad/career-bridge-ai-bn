import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  BulkNotificationDto,
  UpdateNotificationDto,
  NotificationQueryDto,
} from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a notification (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create bulk notifications (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Bulk notifications created successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  createBulk(@Body() bulkNotificationDto: BulkNotificationDto) {
    return this.notificationsService.createBulkNotifications(
      bulkNotificationDto,
    );
  }

  @Post('system')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create system notification for all users (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'System notification created successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  createSystemNotification(
    @Body()
    body: {
      title: string;
      content: string;
      link?: string;
      userIds?: string[];
    },
  ) {
    return this.notificationsService.createSystemNotification(
      body.title,
      body.content,
      body.userIds,
      body.link,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'read', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully.',
  })
  getMyNotifications(@Request() req, @Query() query: NotificationQueryDto) {
    return this.notificationsService.getUserNotifications(req.user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics for current user' })
  @ApiResponse({
    status: 200,
    description: 'Notification statistics retrieved successfully.',
  })
  getMyNotificationStats(@Request() req) {
    return this.notificationsService.getNotificationStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  getNotification(@Param('id') id: string, @Request() req) {
    return this.notificationsService.getNotificationById(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update notification' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  updateNotification(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Request() req,
  ) {
    return this.notificationsService.updateNotification(
      id,
      req.user.id,
      updateNotificationDto,
    );
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Notification marked as read.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read.',
  })
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 204,
    description: 'Notification deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  deleteNotification(@Param('id') id: string, @Request() req) {
    return this.notificationsService.deleteNotification(id, req.user.id);
  }

  // Admin endpoints for managing notifications
  @Get('admin/users/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get notifications for specific user (Admin only)' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({
    status: 200,
    description: 'User notifications retrieved successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getUserNotifications(
    @Param('userId') userId: string,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.getUserNotifications(userId, query);
  }

  @Get('admin/users/:userId/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get notification statistics for specific user (Admin only)',
  })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({
    status: 200,
    description: 'User notification statistics retrieved successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getUserNotificationStats(@Param('userId') userId: string) {
    return this.notificationsService.getNotificationStats(userId);
  }
}
