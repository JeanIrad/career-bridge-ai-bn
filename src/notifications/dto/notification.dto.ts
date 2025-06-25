import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

// export enum NotificationType {
//   SYSTEM = 'SYSTEM',
//   MESSAGE = 'MESSAGE',
//   JOB_ALERT = 'JOB_ALERT',
//   EVENT_REMINDER = 'EVENT_REMINDER',
//   CONNECTION_REQUEST = 'CONNECTION_REQUEST',
//   PROFILE_UPDATE = 'PROFILE_UPDATE',
//   SECURITY_ALERT = 'SECURITY_ALERT',
//   ADMIN_ANNOUNCEMENT = 'ADMIN_ANNOUNCEMENT',
//   CHAT_MESSAGE = 'CHAT_MESSAGE',
//   DOCUMENT_VERIFICATION = 'DOCUMENT_VERIFICATION',
//   APPLICATION_STATUS = 'APPLICATION_STATUS',
//   WELCOME = 'WELCOME',
//   PROMOTION = 'PROMOTION',
// }

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  link?: string;

  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendPush?: boolean;
}

export class BulkNotificationDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  link?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  userIds: string[];

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendPush?: boolean;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}

export class NotificationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20;
}

export class NotificationPreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  jobAlerts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  messageNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  eventReminders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  securityAlerts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  weeklyDigest?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailFrequency?: 'immediate' | 'daily' | 'weekly' | 'never';
}
