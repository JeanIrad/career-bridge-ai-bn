// import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'prisma/prisma.service';
// import { ClerkService } from './clerk.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { v4 as uuidv4 } from 'uuid';

// @Injectable()
// export class AuthService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly clerk: ClerkService,
//   ) {}
//   async register(dto: CreateUserDto) {
// //     const clerkUser = await this.clerk.createUser(dto);

// //     const user = await this.prisma.user.create({
// //       data: {
// //         id: uuidv4(),
// //         email: dto.email,
// //         name: dto.name,
// //         clerkId: clerkUser.id,
// //       },
// //     });

// //     return { user };
//   }
// }
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  access_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ message: string; user: Omit<User, 'password'> }> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.usersService.create(registerDto);

    const { password, ...userWithoutPassword } = user;

    return {
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    const { password, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (
      user &&
      (await this.usersService.validatePassword(password, user.password))
    ) {
      return user;
    }

    return null;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    return this.usersService.findById(payload.id);
  }
}
