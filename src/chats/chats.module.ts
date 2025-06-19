import { Module, forwardRef } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGatway } from './chats-gateway';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [JwtModule, forwardRef(() => AuthModule)],
  providers: [ChatsService, PrismaService, ChatGatway],
  controllers: [ChatsController],
  exports: [ChatsService, ChatGatway],
})
export class ChatsModule {}
