// import {
//   Controller,
//   Post,
//   Body,
//   Get,
//   UseGuards,
//   Res,
//   HttpStatus,
//   Delete,
// } from '@nestjs/common';
// import { Response } from 'express';
// import { ClerkService } from './clerk.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { LoginUserDto } from './dto/create-user.dto';
// import { AuthGuard } from './guards/auth.guard';
// import { SessionGuard } from './guards/session.guard';
// import {
//   CurrentUser,
//   CurrentSession,
// } from './decorators/current-user.decorator';
// import { ClerkUser } from './interfaces/auth.interface';
// import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

// @Controller('auth')
// export class AuthController {
//   constructor(private readonly clerkService: ClerkService) {}

//   @Post('register')
//   async register(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
//     try {
//       const result = await this.clerkService.registerUser(createUserDto);
//       return res.status(HttpStatus.CREATED).json(result);
//     } catch (error) {
//       return res.status(HttpStatus.BAD_REQUEST).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   @Post('login')
//   async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
//     try {
//       const result = await this.clerkService.loginUser(loginUserDto);

//       // Set session cookie
//       res.cookie('sessionId', result.token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'strict',
//         maxAge: 24 * 60 * 60 * 1000, // 24 hours
//       });

//       return res.status(HttpStatus.OK).json(result);
//     } catch (error) {
//       return res.status(HttpStatus.UNAUTHORIZED).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'Get current user profile' })
//   @ApiResponse({ status: 200, description: 'User profile' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })

//   @Get('profile')
//   @UseGuards(AuthGuard)
//   async getProfile(@CurrentUser() user: ClerkUser) {
//     return {
//       success: true,
//       data: user,
//     };
//   }
// @ApiBearerAuth()
// @ApiOperation({ summary: 'Get current user profile' })
// @ApiResponse({ status: 200, description: 'User profile' })
// @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @Get('me')
//   @UseGuards(SessionGuard)
//   async getCurrentUser(@CurrentUser() user: ClerkUser) {
//     return {
//       success: true,
//       data: {
//         id: user.id,
//         email: user.emailAddresses[0]?.emailAddress,
//         firstName: user.firstName,
//         lastName: user.lastName,
//       },
//     };
//   }

//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'Logout user' })
//   @ApiResponse({ status: 200, description: 'Logged out successfully' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @Delete('logout')
//   @UseGuards(SessionGuard)
//   async logout(@CurrentSession() sessionId: string, @Res() res: Response) {
//     try {
//       await this.clerkService.revokeSession(sessionId);

//       // Clear session cookie
//       res.clearCookie('sessionId');

//       return res.status(HttpStatus.OK).json({
//         success: true,
//         message: 'Logged out successfully',
//       });
//     } catch (error) {
//       return res.status(HttpStatus.BAD_REQUEST).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'Verify token' })
//   @ApiResponse({ status: 200, description: 'Token is valid' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @Get('verify')
//   @UseGuards(AuthGuard)
//   verifyToken() {
//     return  {
//       success: true,
//       message: 'Token is valid',
//     };
//   }
// }
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService, AuthResponse } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { User } from '@prisma/client';
import { CurrentUser } from './decorators/current-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body()
    registerDto: RegisterDto,
  ): Promise<{ message: string; user: Omit<User, 'password'> }> {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return await this.authService.login(loginDto);
  }

  @ApiBearerAuth()
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any): any {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  @ApiBearerAuth()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  checkAuth(@CurrentUser() user: any): { user: any } {
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }
}
