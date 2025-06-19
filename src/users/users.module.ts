import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
