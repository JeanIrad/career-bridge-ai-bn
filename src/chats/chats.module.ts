import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [ChatsService, PrismaService],
  controllers: [ChatsController],
  exports: [ChatsService],
})
export class ChatsModule {}
