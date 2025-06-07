// import {
//   Injectable,
//   Logger,
//   BadRequestException,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { verifyToken, createClerkClient } from '@clerk/backend';
// import type { ClerkClient } from '@clerk/backend';
// import { CreateUserDto } from './dto/create-user.dto';
// import { LoginUserDto } from './dto/create-user.dto';
// import { AuthResponse, ClerkUser } from './interfaces/auth.interface';
// import { UsersService } from 'src/users/users.service';
// import * as bcrypt from 'bcrypt';

// @Injectable()
// export class ClerkService {
//   private readonly logger = new Logger(ClerkService.name);
//   private clerkClient: ClerkClient;

//   constructor(private readonly usersService: UsersService) {
//     this.clerkClient = createClerkClient({
//       secretKey: process.env.CLERK_SECRET_KEY,
//     });
//   }

//   async registerUser(dto: CreateUserDto): Promise<AuthResponse> {
//     try {
//       const existingUser = await this.usersService.findByEmail(dto.email);
//       if (existingUser) {
//         throw new BadRequestException('User already exists');
//       }

//       const clerkUser = await this.clerkClient.users.createUser({
//         emailAddress: [dto.email],
//         password: dto.password,
//         firstName: dto.firstName,
//         lastName: dto.lastName,
//         publicMetadata: {
//           role: dto.role,
//         },
//         createdAt: new Date(),

//       });
//       if (!clerkUser) {
//         throw new BadRequestException('Failed to create user');
//       }
//       const user = await this.usersService.create({
//         clerkId: clerkUser.id,
//         email: dto.email,
//         password: await bcrypt.hash(dto.password, 10),
//         role: dto.role,
//       });
//       this.logger.log(`User registered successfully: ${clerkUser.id}`);
//       console.log('USER', user);
//       return {
//         success: true,
//         message: 'User registered successfully',
//         data: {
//           id: clerkUser.id,
//           email: clerkUser.emailAddresses[0]?.emailAddress,
//           firstName: clerkUser.firstName,
//           lastName: clerkUser.lastName,
//         },
//       };
//     } catch (error) {
//       this.logger.error('Registration failed:', error);
//       throw new BadRequestException(
//         error.errors?.[0]?.message || 'Registration failed',
//       );
//     }
//   }

//   async loginUser(dto: LoginUserDto): Promise<AuthResponse> {
//     try {
//       // Create a session for the user
//       const users = await this.clerkClient.users.getUserList({
//         emailAddress: [dto.email],
//       });

//       if (users.data.length === 0) {
//         throw new UnauthorizedException('Invalid credentials');
//       }

//       const user = users[0];

//       // Create session
//       const session = await this.clerkClient.sessions.createSession({
//         userId: user.id,
//       });

//       this.logger.log(`User logged in successfully: ${user.id}`);

//       return {
//         success: true,
//         message: 'Login successful',
//         token: session.id,
//         data: {
//           id: user.id,
//           email: user.emailAddresses[0]?.emailAddress,
//           firstName: user.firstName,
//           lastName: user.lastName,
//         },
//       };
//     } catch (error) {
//       this.logger.error('Login failed:', error);
//       throw new UnauthorizedException('Invalid credentials');
//     }
//   }

//   async verifyToken(token: string): Promise<any> {
//     try {
//       const payload = await verifyToken(token, {
//         secretKey: process.env.CLERK_SECRET_KEY!,
//       });
//       return payload;
//     } catch (error) {
//       this.logger.error('Token verification failed:', error);
//       throw new UnauthorizedException('Invalid token');
//     }
//   }

//   async getUser(clerkId: string): Promise<ClerkUser> {
//     try {
//       const user = await this.clerkClient.users.getUser(clerkId);
//       return user as ClerkUser;
//     } catch (error) {
//       this.logger.error('Failed to get user:', error);
//       throw new BadRequestException('User not found');
//     }
//   }

//   async getUserFromSession(sessionId: string): Promise<ClerkUser> {
//     try {
//       const session = await this.clerkClient.sessions.getSession(sessionId);
//       if (!session || !session.userId) {
//         throw new UnauthorizedException('Invalid session');
//       }

//       return await this.getUser(session.userId);
//     } catch (error) {
//       this.logger.error('Failed to get user from session:', error);
//       throw new UnauthorizedException('Invalid session');
//     }
//   }

//   async revokeSession(sessionId: string): Promise<void> {
//     try {
//       await this.clerkClient.sessions.revokeSession(sessionId);
//       this.logger.log(`Session revoked: ${sessionId}`);
//     } catch (error) {
//       this.logger.error('Failed to revoke session:', error);
//       throw new BadRequestException('Failed to logout');
//     }
//   }
// }
