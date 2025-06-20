import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { MailService } from '../../mail/mail.service';
import { User, UserRole, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import {
  EnhancedRegisterDto,
  EnhancedLoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  EnableTwoFactorDto,
  VerifyTwoFactorSetupDto,
  DisableTwoFactorDto,
  RefreshTokenDto,
  DeactivateAccountDto,
  ReactivateAccountDto,
  AuthTokens,
  EnhancedAuthResponse,
  TwoFactorSetupResponse,
  SecurityAuditResponse,
} from '../dto/auth.dto';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  sessionId?: string;
}

@Injectable()
export class EnhancedAuthService {
  private readonly logger = new Logger(EnhancedAuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly VERIFICATION_CODE_EXPIRY = 15 * 60 * 1000; // 15 minutes
  private readonly RESET_CODE_EXPIRY = 15 * 60 * 1000; // 15 minutes
  private readonly TWO_FACTOR_CODE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  // ============= ENHANCED REGISTRATION =============

  async enhancedRegister(registerDto: EnhancedRegisterDto): Promise<{
    message: string;
    user: Omit<User, 'password'>;
    requiresVerification: boolean;
  }> {
    // Check if passwords match
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check terms agreement
    if (!registerDto.agreeToTerms) {
      throw new BadRequestException(
        'You must agree to the terms and conditions',
      );
    }

    // Create user with enhanced security
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const verificationToken = this.generateVerificationToken();

    const userData = {
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      role: registerDto.role,
      university: registerDto.university,
      major: registerDto.major,
      graduationYear: registerDto.graduationYear,
      phoneNumber: registerDto.phoneNumber,
      isVerified: false,
      accountStatus: AccountStatus.INACTIVE,
    };

    const user = await this.prisma.user.create({
      data: userData,
      include: {
        education: true,
        experiences: true,
        skills: true,
      },
    });

    // Store verification token
    await this.storeVerificationToken(
      user.email,
      verificationToken,
      'email_verification',
    );

    // Send verification email
    await this.mailService.sendEmailVerification(
      user.email,
      user.firstName,
      verificationToken,
      user.role,
    );

    // Log registration attempt
    await this.logSecurityEvent(user.id, 'REGISTRATION', {
      email: user.email,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      user: userWithoutPassword,
      requiresVerification: true,
    };
  }

  // ============= EMAIL VERIFICATION =============

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{
    message: string;
    user: Omit<User, 'password'>;
  }> {
    const { email, verificationToken } = verifyEmailDto;

    // Verify the token
    const isValidToken = await this.verifyToken(
      email,
      verificationToken,
      'email_verification',
    );
    if (!isValidToken) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Update user status
    const user = await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        accountStatus: AccountStatus.ACTIVE,
      },
      include: {
        education: true,
        experiences: true,
        skills: true,
      },
    });

    // Delete used verification token
    await this.deleteVerificationToken(email, 'email_verification');

    // Send welcome email
    await this.mailService.sendWelcomeEmail(
      user.email,
      user.firstName,
      user.role,
    );

    // Log verification
    await this.logSecurityEvent(user.id, 'EMAIL_VERIFIED', { email });

    const { password, ...userWithoutPassword } = user;

    return {
      message: 'Email verified successfully. Welcome to CareerBridge!',
      user: userWithoutPassword,
    };
  }

  async resendVerificationToken(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = this.generateVerificationToken();
    await this.storeVerificationToken(
      email,
      verificationToken,
      'email_verification',
    );

    await this.mailService.sendEmailVerification(
      email,
      user.firstName,
      verificationToken,
      user.role,
    );

    return { message: 'Verification link sent successfully' };
  }

  // ============= ENHANCED LOGIN =============

  async enhancedLogin(
    loginDto: EnhancedLoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<EnhancedAuthResponse> {
    const { email, password, twoFactorCode, rememberMe, deviceName } = loginDto;

    // Check for account lockout
    await this.checkAccountLockout(email);

    // Validate user credentials
    const user = await this.validateUserCredentials(email, password);
    if (!user) {
      await this.recordFailedLogin(email, ipAddress);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Check if email is verified
    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    // Check for 2FA requirement
    const twoFactorSecret = await this.getTwoFactorSecret(user.id);
    if (twoFactorSecret && !twoFactorCode) {
      // Send 2FA code if using SMS/Email
      const code = this.generateVerificationCode();
      await this.storeVerificationCode(email, code, 'two_factor');
      await this.mailService.sendTwoFactorCode(email, user.firstName, code, {
        ipAddress,
        deviceInfo: userAgent,
      });

      return {
        user: null,
        tokens: null,
        requiresTwoFactor: true,
      };
    }

    // Verify 2FA if provided
    if (twoFactorSecret && twoFactorCode) {
      const isValid2FA = await this.verifyTwoFactorCode(user.id, twoFactorCode);
      if (!isValid2FA) {
        await this.recordFailedLogin(email, ipAddress);
        throw new UnauthorizedException(
          'Invalid two-factor authentication code',
        );
      }
    }

    // Create session
    const sessionId = await this.createUserSession(
      user.id,
      ipAddress,
      userAgent,
      deviceName,
    );

    // Generate tokens
    const tokens = await this.generateTokens(user, sessionId, rememberMe);

    // Reset failed login attempts
    await this.resetFailedLoginAttempts(email);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log successful login
    await this.logSecurityEvent(user.id, 'LOGIN_SUCCESS', {
      ipAddress,
      userAgent,
      deviceName,
    });

    // Check if this is first login
    const isFirstLogin = !user.lastLogin;

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
      isFirstLogin,
      passwordExpiresIn: this.getPasswordExpiryDays(user.updatedAt),
    };
  }

  // ============= PASSWORD RESET =============

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return {
        message:
          'If an account with this email exists, a reset code has been sent.',
      };
    }

    const resetCode = this.generateVerificationCode();
    await this.storeVerificationCode(email, resetCode, 'password_reset');

    await this.mailService.sendPasswordReset(email, user.firstName, resetCode);

    await this.logSecurityEvent(user.id, 'PASSWORD_RESET_REQUESTED', { email });

    return {
      message:
        'If an account with this email exists, a reset code has been sent.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { email, resetCode, newPassword } = resetPasswordDto;

    // Verify reset code
    const isValidCode = await this.verifyCode(
      email,
      resetCode,
      'password_reset',
    );
    if (!isValidCode) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Delete used reset code
    await this.deleteVerificationCode(email, 'password_reset');

    // Revoke all user sessions for security
    await this.revokeAllUserSessions(user.id);

    // Send security notification
    await this.mailService.sendSecurityAlert(
      email,
      user.firstName,
      'Password Reset',
      'Your password has been successfully reset.',
    );

    await this.logSecurityEvent(user.id, 'PASSWORD_RESET_COMPLETED', { email });

    return {
      message:
        'Password reset successfully. Please log in with your new password.',
    };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isValidPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Send security notification
    await this.mailService.sendSecurityAlert(
      user.email,
      user.firstName,
      'Password Changed',
      'Your password has been successfully changed.',
    );

    await this.logSecurityEvent(userId, 'PASSWORD_CHANGED', {});

    return { message: 'Password changed successfully' };
  }

  // ============= TWO-FACTOR AUTHENTICATION =============

  async enableTwoFactor(
    userId: string,
    enableTwoFactorDto: EnableTwoFactorDto,
  ): Promise<TwoFactorSetupResponse> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate secret for TOTP
    const secret = speakeasy.generateSecret({
      name: `CareerBridge (${user.email})`,
      issuer: 'CareerBridge',
    });

    // Store the secret temporarily (will be confirmed after verification)
    await this.storeTwoFactorSecret(userId, secret.base32, false);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    await this.storeBackupCodes(userId, backupCodes);

    return {
      qrCode: secret.otpauth_url,
      backupCodes,
      phoneNumber: enableTwoFactorDto.phoneNumber,
    };
  }

  async verifyTwoFactorSetup(
    userId: string,
    verifyTwoFactorSetupDto: VerifyTwoFactorSetupDto,
  ): Promise<{ message: string }> {
    const { verificationCode } = verifyTwoFactorSetupDto;

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = await this.getTwoFactorSecret(userId);
    if (!secret) {
      throw new BadRequestException(
        'Two-factor authentication setup not found',
      );
    }

    // Verify the code
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: verificationCode,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Confirm the 2FA setup
    await this.confirmTwoFactorSetup(userId);

    await this.logSecurityEvent(userId, 'TWO_FACTOR_ENABLED', {});

    return { message: 'Two-factor authentication enabled successfully' };
  }

  async disableTwoFactor(
    userId: string,
    disableTwoFactorDto: DisableTwoFactorDto,
  ): Promise<{ message: string }> {
    const { verificationCode } = disableTwoFactorDto;

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current 2FA code before disabling
    const isValid = await this.verifyTwoFactorCode(userId, verificationCode);
    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Remove 2FA data
    await this.removeTwoFactorData(userId);

    await this.logSecurityEvent(userId, 'TWO_FACTOR_DISABLED', {});

    return { message: 'Two-factor authentication disabled successfully' };
  }

  // ============= TOKEN MANAGEMENT =============

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      }) as JwtPayload;

      // Check if session is still valid
      const session = await this.getUserSession(payload.sessionId || '');
      if (!session || !session.isActive) {
        throw new UnauthorizedException('Invalid session');
      }

      const user = await this.usersService.findById(payload.id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      return this.generateTokens(user, payload.sessionId);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ============= ACCOUNT MANAGEMENT =============

  async deactivateAccount(
    userId: string,
    deactivateAccountDto: DeactivateAccountDto,
  ): Promise<{ message: string }> {
    const { password, reason } = deactivateAccountDto;

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new BadRequestException('Invalid password');
    }

    // Deactivate account
    await this.prisma.user.update({
      where: { id: userId },
      data: { accountStatus: AccountStatus.INACTIVE },
    });

    // Revoke all sessions
    await this.revokeAllUserSessions(userId);

    // Send deactivation email
    await this.mailService.sendAccountDeactivation(
      user.email,
      user.firstName,
      reason,
    );

    await this.logSecurityEvent(userId, 'ACCOUNT_DEACTIVATED', { reason });

    return { message: 'Account deactivated successfully' };
  }

  async requestAccountReactivation(
    email: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        message:
          'If an account with this email exists, a reactivation code has been sent.',
      };
    }

    if (user.accountStatus === AccountStatus.ACTIVE) {
      throw new BadRequestException('Account is already active');
    }

    const reactivationCode = this.generateVerificationCode();
    await this.storeVerificationCode(
      email,
      reactivationCode,
      'account_reactivation',
    );

    await this.mailService.sendAccountReactivation(
      email,
      user.firstName,
      reactivationCode,
    );

    return {
      message:
        'If an account with this email exists, a reactivation code has been sent.',
    };
  }

  async reactivateAccount(
    reactivateAccountDto: ReactivateAccountDto,
  ): Promise<{ message: string }> {
    const { email, reactivationCode } = reactivateAccountDto;

    // Verify reactivation code
    const isValidCode = await this.verifyCode(
      email,
      reactivationCode,
      'account_reactivation',
    );
    if (!isValidCode) {
      throw new BadRequestException('Invalid or expired reactivation code');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Reactivate account
    await this.prisma.user.update({
      where: { email },
      data: { accountStatus: AccountStatus.ACTIVE },
    });

    // Delete used reactivation code
    await this.deleteVerificationCode(email, 'account_reactivation');

    await this.logSecurityEvent(user.id, 'ACCOUNT_REACTIVATED', { email });

    return { message: 'Account reactivated successfully. You can now log in.' };
  }

  // ============= SESSION MANAGEMENT =============

  async getUserSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        deviceName: true,
        ipAddress: true,
        userAgent: true,
        lastActivity: true,
        createdAt: true,
      },
    });
  }

  async revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<{ message: string }> {
    await this.prisma.userSession.update({
      where: { id: sessionId, userId },
      data: { isActive: false },
    });

    await this.logSecurityEvent(userId, 'SESSION_REVOKED', { sessionId });

    return { message: 'Session revoked successfully' };
  }

  async revokeAllSessions(userId: string): Promise<{ message: string }> {
    await this.revokeAllUserSessions(userId);

    await this.logSecurityEvent(userId, 'ALL_SESSIONS_REVOKED', {});

    return { message: 'All sessions revoked successfully' };
  }

  // ============= SECURITY AUDIT =============

  async getSecurityAudit(userId: string): Promise<SecurityAuditResponse> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [loginAttempts, failedAttempts, activeSessions, twoFactorEnabled] =
      await Promise.all([
        this.getLoginAttempts(userId),
        this.getFailedLoginAttempts(user.email),
        this.getActiveSessionsCount(userId),
        this.isTwoFactorEnabled(userId),
      ]);

    return {
      lastLoginAt: user.lastLogin || new Date(),
      loginAttempts,
      failedAttempts,
      activeSessions,
      trustedDevices: activeSessions, // For now, same as active sessions
      twoFactorEnabled,
      lastPasswordChange: user.updatedAt,
    };
  }

  // ============= HELPER METHODS =============

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate a secure verification token
   */
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );
  }

  private async storeVerificationCode(
    email: string,
    code: string,
    type: string,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + this.VERIFICATION_CODE_EXPIRY);

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
   * Store verification token in database
   */
  private async storeVerificationToken(
    email: string,
    token: string,
    type: string,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.verificationCode.upsert({
      where: {
        email_type: {
          email,
          type,
        },
      },
      update: {
        token,
        expiresAt,
        attempts: 0,
        isUsed: false,
      },
      create: {
        email,
        token,
        type,
        expiresAt,
        attempts: 0,
        isUsed: false,
      },
    });
  }

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
    if (new Date() > verificationRecord.expiresAt) {
      await this.deleteVerificationCode(email, type);
      return false;
    }

    // Check if too many attempts
    if (verificationRecord.attempts >= 3) {
      await this.deleteVerificationCode(email, type);
      return false;
    }

    // Check if code matches
    if (verificationRecord.code !== code) {
      await this.prisma.verificationCode.update({
        where: {
          email_type: {
            email,
            type,
          },
        },
        data: { attempts: { increment: 1 } },
      });
      return false;
    }

    return true;
  }

  /**
   * Verify verification token
   */
  private async verifyToken(
    email: string,
    token: string,
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

    if (!verificationRecord || !verificationRecord.token) {
      return false;
    }

    // Check if token is expired
    if (new Date() > verificationRecord.expiresAt) {
      await this.deleteVerificationToken(email, type);
      return false;
    }

    // Check if token has been used
    if (verificationRecord.isUsed) {
      return false;
    }

    // Check if token matches
    if (verificationRecord.token !== token) {
      return false;
    }

    // Mark token as used
    await this.prisma.verificationCode.update({
      where: {
        email_type: {
          email,
          type,
        },
      },
      data: {
        isUsed: true,
      },
    });

    return true;
  }

  private async deleteVerificationCode(
    email: string,
    type: string,
  ): Promise<void> {
    await this.prisma.verificationCode.deleteMany({
      where: { email, type },
    });
  }

  /**
   * Delete verification token
   */
  private async deleteVerificationToken(
    email: string,
    type: string,
  ): Promise<void> {
    await this.prisma.verificationCode.deleteMany({
      where: { email, type },
    });
  }

  private async validateUserCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    return isValidPassword ? user : null;
  }

  private async checkAccountLockout(email: string): Promise<void> {
    const lockoutRecord = await this.prisma.accountLockout.findUnique({
      where: { email },
    });

    if (
      lockoutRecord &&
      lockoutRecord.lockedUntil &&
      lockoutRecord.lockedUntil > new Date()
    ) {
      const minutesLeft = Math.ceil(
        (lockoutRecord.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenException(
        `Account is locked. Try again in ${minutesLeft} minutes.`,
      );
    }
  }

  private async recordFailedLogin(
    email: string,
    ipAddress?: string,
  ): Promise<void> {
    const lockoutRecord = await this.prisma.accountLockout.upsert({
      where: { email },
      update: {
        failedAttempts: { increment: 1 },
        lastFailedAttempt: new Date(),
        ipAddress,
      },
      create: {
        email,
        failedAttempts: 1,
        lastFailedAttempt: new Date(),
        ipAddress,
      },
    });

    // Lock account if too many failed attempts
    if (lockoutRecord.failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      await this.prisma.accountLockout.update({
        where: { email },
        data: {
          lockedUntil: new Date(Date.now() + this.LOCKOUT_DURATION),
        },
      });
    }
  }

  private async resetFailedLoginAttempts(email: string): Promise<void> {
    await this.prisma.accountLockout.deleteMany({
      where: { email },
    });
  }

  private async createUserSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    deviceName?: string,
  ): Promise<string> {
    const session = await this.prisma.userSession.create({
      data: {
        userId,
        ipAddress,
        userAgent,
        deviceName,
        isActive: true,
        lastActivity: new Date(),
      },
    });

    return session.id;
  }

  private async generateTokens(
    user: User,
    sessionId?: string,
    rememberMe: boolean = false,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    const accessTokenExpiry = rememberMe ? '7d' : '1h';
    const refreshTokenExpiry = rememberMe ? '30d' : '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: accessTokenExpiry,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: refreshTokenExpiry,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: rememberMe ? 7 * 24 * 60 * 60 : 60 * 60, // seconds
      refreshExpiresIn: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // seconds
    };
  }

  private async getTwoFactorSecret(userId: string): Promise<string | null> {
    const record = await this.prisma.twoFactorAuth.findUnique({
      where: { userId },
    });
    return record?.secret || null;
  }

  private async verifyTwoFactorCode(
    userId: string,
    code: string,
  ): Promise<boolean> {
    const secret = await this.getTwoFactorSecret(userId);
    if (!secret) {
      return false;
    }

    // Try TOTP verification
    const isValidTOTP = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (isValidTOTP) {
      return true;
    }

    // Try backup code verification
    return this.verifyBackupCode(userId, code);
  }

  private async storeTwoFactorSecret(
    userId: string,
    secret: string,
    isConfirmed: boolean = false,
  ): Promise<void> {
    await this.prisma.twoFactorAuth.upsert({
      where: { userId },
      update: { secret, isConfirmed },
      create: { userId, secret, isConfirmed },
    });
  }

  private async confirmTwoFactorSetup(userId: string): Promise<void> {
    await this.prisma.twoFactorAuth.update({
      where: { userId },
      data: { isConfirmed: true },
    });
  }

  private async removeTwoFactorData(userId: string): Promise<void> {
    await Promise.all([
      this.prisma.twoFactorAuth.deleteMany({ where: { userId } }),
      this.prisma.backupCode.deleteMany({ where: { userId } }),
    ]);
  }

  private async storeBackupCodes(
    userId: string,
    codes: string[],
  ): Promise<void> {
    const backupCodes = codes.map((code) => ({
      userId,
      code: bcrypt.hashSync(code, 10),
      isUsed: false,
    }));

    await this.prisma.backupCode.createMany({
      data: backupCodes,
    });
  }

  private async verifyBackupCode(
    userId: string,
    code: string,
  ): Promise<boolean> {
    const backupCodes = await this.prisma.backupCode.findMany({
      where: { userId, isUsed: false },
    });

    for (const backupCode of backupCodes) {
      const isValid = bcrypt.compareSync(code, backupCode.code);
      if (isValid) {
        await this.prisma.backupCode.update({
          where: { id: backupCode.id },
          data: { isUsed: true },
        });
        return true;
      }
    }

    return false;
  }

  private async getUserSession(sessionId: string) {
    return this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });
  }

  private async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  private async logSecurityEvent(
    userId: string,
    event: string,
    metadata: any,
  ): Promise<void> {
    await this.prisma.securityLog.create({
      data: {
        userId,
        event,
        metadata,
        timestamp: new Date(),
      },
    });
  }

  private getPasswordExpiryDays(lastPasswordChange: Date): number {
    const daysSinceChange = Math.floor(
      (Date.now() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24),
    );
    const maxPasswordAge = 90; // 90 days
    return Math.max(0, maxPasswordAge - daysSinceChange);
  }

  private async getLoginAttempts(userId: string): Promise<number> {
    const count = await this.prisma.securityLog.count({
      where: {
        userId,
        event: 'LOGIN_SUCCESS',
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });
    return count;
  }

  private async getFailedLoginAttempts(email: string): Promise<number> {
    const lockoutRecord = await this.prisma.accountLockout.findUnique({
      where: { email },
    });
    return lockoutRecord?.failedAttempts || 0;
  }

  private async getActiveSessionsCount(userId: string): Promise<number> {
    return this.prisma.userSession.count({
      where: { userId, isActive: true },
    });
  }

  private async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const record = await this.prisma.twoFactorAuth.findUnique({
      where: { userId },
    });
    return record?.isConfirmed || false;
  }
}
