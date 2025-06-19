import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, AccountStatus } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt.guard';
import { Get } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

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
    private mailService: MailService,
    private prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    message: string;
    user: Omit<User, 'password'>;
    requiresVerification: boolean;
  }> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = (await this.usersService.validatePassword)
      ? await bcrypt.hash(registerDto.password, 10)
      : registerDto.password;

    // Create user directly with Prisma to set isVerified = false
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        password: hashedPassword,
        role: registerDto.role || 'STUDENT',
        university: registerDto.university,
        major: registerDto.major,
        graduationYear: registerDto.graduationYear,
        isVerified: false, // Set to false initially
        accountStatus: AccountStatus.INACTIVE, // Set to inactive until verified
      },
    });

    // Generate verification code
    const verificationCode = this.generateVerificationCode();

    // Store verification code in database
    await this.storeVerificationCode(
      user.email,
      verificationCode,
      'email_verification',
    );

    // Send verification email
    try {
      await this.mailService.sendEmailVerification(
        user.email,
        user.firstName,
        verificationCode,
        user.role,
      );
    } catch (error) {
      // If email fails, still return success but log the error
      console.error('Failed to send verification email:', error);
    }

    const { password, ...userWithoutPassword } = user;

    return {
      message:
        'Registration successful! Please check your email to verify your account before logging in.',
      user: userWithoutPassword,
      requiresVerification: true,
    };
  }

  /**
   * Verify email with verification code
   */
  async verifyEmail(
    email: string,
    verificationCode: string,
  ): Promise<{
    message: string;
    user: Omit<User, 'password'>;
  }> {
    // Verify the code
    const isValidCode = await this.verifyCode(
      email,
      verificationCode,
      'email_verification',
    );

    if (!isValidCode) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    // Update user to verified
    const user = await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        accountStatus: AccountStatus.ACTIVE,
      },
    });

    // Delete used verification code
    await this.deleteVerificationCode(email, 'email_verification');

    // Send welcome email
    try {
      await this.mailService.sendWelcomeEmail(
        user.email,
        user.firstName,
        user.role,
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    const { password, ...userWithoutPassword } = user;

    return {
      message: 'Email verified successfully! Welcome to CareerBridge AI.',
      user: userWithoutPassword,
    };
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new ConflictException('User not found');
    }

    if (user.isVerified) {
      throw new ConflictException('Account is already verified');
    }

    // Generate new verification code
    const verificationCode = this.generateVerificationCode();

    // Store new verification code (this will replace the old one)
    await this.storeVerificationCode(
      user.email,
      verificationCode,
      'email_verification',
    );

    // Send new verification email
    await this.mailService.sendEmailVerification(
      user.email,
      user.firstName,
      verificationCode,
      user.role,
    );

    return {
      message: 'New verification code sent to your email.',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is verified
    if (!user.isVerified) {
      throw new ForbiddenException(
        'Account is not verified. Please verify your email before logging in.',
      );
    }

    // Check if account is active
    if (user.accountStatus !== AccountStatus.ACTIVE) {
      const statusMessages = {
        [AccountStatus.INACTIVE]:
          'Account is inactive. Please contact support to reactivate your account.',
        [AccountStatus.SUSPENDED]:
          'Account is suspended. Please contact support for assistance.',
      };

      throw new ForbiddenException(
        statusMessages[user.accountStatus] || 'Account access is restricted.',
      );
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

    if (!user) {
      return null;
    }

    // First validate password
    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      return null;
    }

    // Don't return user if account is not verified or not active
    // This prevents any further processing for invalid accounts
    if (!user.isVerified) {
      throw new ForbiddenException(
        'Account is not verified. Please verify your email first.',
      );
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      const statusMessages = {
        [AccountStatus.INACTIVE]:
          'Account is inactive. Please contact support.',
        [AccountStatus.SUSPENDED]:
          'Account is suspended. Please contact support.',
      };

      throw new ForbiddenException(
        statusMessages[user.accountStatus] || 'Account access is restricted.',
      );
    }

    return user;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    const user = await this.usersService.findById(payload.id);

    // Also validate account status for JWT validation
    if (
      !user ||
      !user.isVerified ||
      user.accountStatus !== AccountStatus.ACTIVE
    ) {
      return null;
    }

    return user;
  }

  /**
   * Helper method to check account eligibility for login
   */
  private validateAccountEligibility(user: User): void {
    if (!user.isVerified) {
      throw new ForbiddenException({
        message:
          'Account is not verified. Please verify your email before logging in.',
        code: 'ACCOUNT_NOT_VERIFIED',
        action:
          'Please check your email for verification link or request a new one.',
      });
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      const statusDetails = {
        [AccountStatus.INACTIVE]: {
          message:
            'Account is inactive. Please contact support to reactivate your account.',
          code: 'ACCOUNT_INACTIVE',
          action: 'Contact support or use account reactivation feature.',
        },
        [AccountStatus.SUSPENDED]: {
          message:
            'Account is suspended. Please contact support for assistance.',
          code: 'ACCOUNT_SUSPENDED',
          action: 'Contact support to resolve account suspension.',
        },
      };

      const details = statusDetails[user.accountStatus] || {
        message: 'Account access is restricted.',
        code: 'ACCOUNT_RESTRICTED',
        action: 'Contact support for assistance.',
      };

      throw new ForbiddenException(details);
    }
  }

  /**
   * Enhanced login with detailed account status checking
   */
  async loginWithValidation(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check account eligibility
    this.validateAccountEligibility(user);

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

  /**
   * Check if user can access the system (for middleware/guards)
   */
  async canUserAccess(userId: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    return !!(
      user &&
      user.isVerified &&
      user.accountStatus === AccountStatus.ACTIVE
    );
  }

  /**
   * Generate a 6-digit verification code
   */
  private generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Store verification code in database
   */
  private async storeVerificationCode(
    email: string,
    code: string,
    type: string,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.verificationCode.upsert({
      where: {
        email_type: {
          email,
          type,
        },
      },
      update: {
        code,
        expiresAt,
        attempts: 0,
      },
      create: {
        email,
        code,
        type,
        expiresAt,
        attempts: 0,
      },
    });
  }

  /**
   * Verify verification code
   */
  private async verifyCode(
    email: string,
    code: string,
    type: string,
  ): Promise<boolean> {
    const verificationRecord = await this.prisma.verificationCode.findUnique({
      where: {
        email_type: {
          email,
          type,
        },
      },
    });

    if (!verificationRecord) {
      return false;
    }

    // Check if code is expired
    if (verificationRecord.expiresAt < new Date()) {
      await this.deleteVerificationCode(email, type);
      return false;
    }

    // Check if too many attempts
    if (verificationRecord.attempts >= 5) {
      await this.deleteVerificationCode(email, type);
      return false;
    }

    // Check if code matches
    if (verificationRecord.code !== code) {
      // Increment attempts
      await this.prisma.verificationCode.update({
        where: {
          email_type: {
            email,
            type,
          },
        },
        data: {
          attempts: verificationRecord.attempts + 1,
        },
      });
      return false;
    }

    return true;
  }

  /**
   * Delete verification code
   */
  private async deleteVerificationCode(
    email: string,
    type: string,
  ): Promise<void> {
    await this.prisma.verificationCode.deleteMany({
      where: {
        email,
        type,
      },
    });
  }
}
