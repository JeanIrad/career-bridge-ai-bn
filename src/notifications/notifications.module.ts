import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, PrismaService, MailService, UsersService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
