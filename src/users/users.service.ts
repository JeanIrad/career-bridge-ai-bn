// import { Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../../prisma/prisma.service';
// import { User, Prisma } from '@prisma/client';

// @Injectable()
// export class UsersService {
//   constructor(private prisma: PrismaService) {}

//   async create(data: Prisma.UserCreateInput): Promise<User> {
//     return await this.prisma.user.create({
//       data,
//       include: {
//         profile: true,
//       },
//     });
//   }

//   async findAll(): Promise<User[]> {
//     return await this.prisma.user.findMany({
//       include: {
//         profile: true,
//       },
//     });
//   }

//   async findOne(id: string): Promise<User | null> {
//     return await this.prisma.user.findUnique({
//       where: { id },
//       include: {
//         profile: true,
//         posts: true,
//       },
//     });
//   }

//   async findByClerkId(clerkId: string): Promise<User | null> {
//     return await this.prisma.user.findUnique({
//       where: { clerkId },
//       include: {
//         profile: true,
//       },
//     });
//   }

//   async findByEmail(email: string): Promise<User | null> {
//     return await this.prisma.user.findUnique({
//       where: { email },
//       include: {
//         profile: true,
//       },
//     });
//   }

//   async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
//     try {
//       return await this.prisma.user.update({
//         where: { id },
//         data,
//         include: {
//           profile: true,
//         },
//       });
//     } catch (error) {
//       if (error.code === 'P2025') {
//         throw new NotFoundException(`User with ID ${id} not found`);
//       }
//       throw error;
//     }
//   }

//   async updateByClerkId(
//     clerkId: string,
//     data: Prisma.UserUpdateInput,
//   ): Promise<User> {
//     try {
//       return await this.prisma.user.update({
//         where: { clerkId },
//         data,
//         include: {
//           profile: true,
//         },
//       });
//     } catch (error) {
//       if (error.code === 'P2025') {
//         throw new NotFoundException(`User with Clerk ID ${clerkId} not found`);
//       }
//       throw error;
//     }
//   }

//   async remove(id: string): Promise<User> {
//     try {
//       return await this.prisma.user.delete({
//         where: { id },
//       });
//     } catch (error) {
//       if (error.code === 'P2025') {
//         throw new NotFoundException(`User with ID ${id} not found`);
//       }
//       throw error;
//     }
//   }

//   async createProfile(
//     userId: string,
//     data: Prisma.ProfileCreateInput,
//   ): Promise<User> {
//     return await this.prisma.user.update({
//       where: { id: userId },
//       data: {
//         profile: {
//           create: data,
//         },
//       },
//       include: {
//         profile: true,
//       },
//     });
//   }
// }

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    return this.prisma.user.create({
      data: {
   
        email: createUserDto.email,
        password: hashedPassword,
        // profile: {
        //   // create: {
        //   //   // university: createUserDto.university || null,
        //   //   // major: createUserDto.major || null,
        //   //   // graduationYear: createUserDto.graduationYear || null,
        //   // },
        //   true
        // },
      },
      include: {
        profile: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}