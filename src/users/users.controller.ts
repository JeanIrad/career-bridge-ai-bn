import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, Prisma } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

//   @Post()
//   async create(@Body() data: Prisma.UserCreateInput): Promise<User> {
//     return this.usersService.create(data);
//   }

  // @Get()
  // async findAll(): Promise<User[]> {
  //   return this.usersService.findAll();
  // }

  // @Get(':id')
  // async findOne(@Param('id') id: string): Promise<User> {
  //   const user = await this.usersService.findOne(id);
  //   if (!user) {
  //     throw new NotFoundException(`User with ID ${id} not found`);
  //   }
  //   return user;
  // }

  // @Get('clerk/:clerkId')
  // async findByClerkId(@Param('clerkId') clerkId: string): Promise<User> {
  //   const user = await this.usersService.findByClerkId(clerkId);
  //   if (!user) {
  //     throw new NotFoundException(`User with Clerk ID ${clerkId} not found`);
  //   }
  //   return user;
  // }

  // @Get('email/:email')
  // async findByEmail(@Param('email') email: string): Promise<User> {
  //   const user = await this.usersService.findByEmail(email);
  //   if (!user) {
  //     throw new NotFoundException(`User with email ${email} not found`);
  //   }
  //   return user;
  // }

  // @Patch(':id')
  // async update(
  //   @Param('id') id: string,
  //   @Body() data: Prisma.UserUpdateInput,
  // ): Promise<User> {
  //   return this.usersService.update(id, data);
  // }

  // @Patch('clerk/:clerkId')
  // async updateByClerkId(
  //   @Param('clerkId') clerkId: string,
  //   @Body() data: Prisma.UserUpdateInput,
  // ): Promise<User> {
  //   return this.usersService.updateByClerkId(clerkId, data);
  // }

  // @Delete(':id')
  // async remove(@Param('id') id: string): Promise<User> {
  //   return this.usersService.remove(id);
  // }

  // @Post(':id/profile')
  // async createProfile(
  //   @Param('id') userId: string,
  //   @Body() data: Prisma.ProfileCreateInput,
  // ): Promise<User> {
  //   return this.usersService.createProfile(userId, data);
  // }
}
