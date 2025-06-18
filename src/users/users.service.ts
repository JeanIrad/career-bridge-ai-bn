import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma, User, UserRole } from '@prisma/client';
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

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async createProfile(
    userId: string,
    data: {
      firstName: string;
      lastName: string;
      headline?: string;
      bio?: string;
      avatar?: string;
      contactNumber?: string;
      location?: string;
      socialLinks?: Record<string, string>;
      visibility?: 'PUBLIC' | 'PRIVATE' | 'CONNECTIONS';
    },
  ): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          profile: {
            create: data,
          },
        },
        include: {
          profile: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      throw error;
    }
  }
}
