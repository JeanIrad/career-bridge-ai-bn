import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  Matches,
  Length,
  IsPhoneNumber,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

// ============= EMAIL VERIFICATION =============
export class RequestEmailVerificationDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'abc123def456789...' })
  @IsString()
  @MinLength(32, {
    message: 'Verification token must be at least 32 characters',
  })
  verificationToken: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;
}

// ============= PASSWORD RESET =============
export class ForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Reset code must be exactly 6 characters' })
  resetCode: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description:
      'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;
}

export class ValidateResetCodeDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Reset code must be exactly 6 characters' })
  resetCode: string;
}

// ============= PASSWORD CHANGE =============
export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPassword123!' })
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description:
      'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;
}

// ============= TWO-FACTOR AUTHENTICATION =============
export class EnableTwoFactorDto {
  @ApiProperty({ example: '+1234567890' })
  @IsPhoneNumber()
  phoneNumber: string;
}

export class VerifyTwoFactorSetupDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 characters' })
  verificationCode: string;
}

export class DisableTwoFactorDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 characters' })
  verificationCode: string;
}

export class VerifyTwoFactorDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 characters' })
  twoFactorCode: string;
}

// ============= REFRESH TOKEN =============
export class RefreshTokenDto {
  @ApiProperty({ example: 'refresh_token_here' })
  @IsString()
  refreshToken: string;
}

// ============= ACCOUNT MANAGEMENT =============
export class DeactivateAccountDto {
  @ApiProperty({ example: 'CurrentPassword123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: 'No longer need the account',
    description: 'Reason for deactivation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ReactivateAccountDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Reactivation code must be exactly 6 characters' })
  reactivationCode: string;
}

// ============= SOCIAL LOGIN =============
export class SocialLoginDto {
  @ApiProperty({ example: 'google' })
  @IsString()
  @IsEnum(['google', 'linkedin', 'facebook'], {
    message: 'Provider must be one of: google, linkedin, facebook',
  })
  provider: 'google' | 'linkedin' | 'facebook';

  @ApiProperty({ example: 'social_access_token_here' })
  @IsString()
  accessToken: string;
}

// ============= SECURITY VERIFICATION =============
export class VerifySecurityQuestionDto {
  @ApiProperty({ example: "What is your mother's maiden name?" })
  @IsString()
  question: string;

  @ApiProperty({ example: 'Johnson' })
  @IsString()
  answer: string;
}

export class UpdateSecurityQuestionsDto {
  @ApiProperty({
    example: [
      { question: "What is your mother's maiden name?", answer: 'Johnson' },
      { question: "What is your first pet's name?", answer: 'Buddy' },
    ],
  })
  securityQuestions: Array<{
    question: string;
    answer: string;
  }>;
}

// ============= DEVICE MANAGEMENT =============
export class RegisterDeviceDto {
  @ApiProperty({ example: 'iPhone 13 Pro' })
  @IsString()
  deviceName: string;

  @ApiProperty({ example: 'iOS' })
  @IsString()
  deviceType: string;

  @ApiPropertyOptional({ example: 'San Francisco, CA' })
  @IsOptional()
  @IsString()
  location?: string;
}

export class RevokeDeviceDto {
  @ApiProperty({ example: 'device-uuid' })
  @IsUUID()
  deviceId: string;
}

// ============= AUDIT & SECURITY =============
export class ReportSuspiciousActivityDto {
  @ApiProperty({ example: 'Unauthorized login attempt' })
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  suspiciousIp?: string;
}

// ============= ENHANCED LOGIN =============
export class EnhancedLoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Required if 2FA is enabled',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  twoFactorCode?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Keep user logged in for extended period',
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean = false;

  @ApiPropertyOptional({ example: 'iPhone 13 Pro' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

// ============= ENHANCED REGISTER =============
export class EnhancedRegisterDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  confirmPassword: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'Harvard University' })
  @IsOptional()
  @IsString()
  university?: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  graduationYear?: number;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Agree to terms and conditions',
  })
  @IsBoolean()
  agreeToTerms: boolean = false;

  @ApiPropertyOptional({
    example: false,
    description: 'Subscribe to marketing emails',
  })
  @IsOptional()
  @IsBoolean()
  subscribeToNewsletter?: boolean = false;
}

// ============= SESSION MANAGEMENT =============
export class SessionDto {
  @ApiProperty({ example: 'session-uuid' })
  @IsUUID()
  sessionId: string;
}

export class RevokeSessionDto {
  @ApiProperty({ example: 'session-uuid' })
  @IsUUID()
  sessionId: string;
}

export class RevokeAllSessionsDto {
  @ApiProperty({ example: 'CurrentPassword123!' })
  @IsString()
  @MinLength(6)
  password: string;
}

// ============= RESPONSE TYPES =============
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface EnhancedAuthResponse {
  user: any;
  tokens: AuthTokens | null;
  requiresTwoFactor?: boolean;
  isFirstLogin?: boolean;
  passwordExpiresIn?: number;
}

export interface TwoFactorSetupResponse {
  qrCode?: string;
  backupCodes: string[];
  phoneNumber?: string;
}

export interface SecurityAuditResponse {
  lastLoginAt: Date;
  loginAttempts: number;
  failedAttempts: number;
  activeSessions: number;
  trustedDevices: number;
  twoFactorEnabled: boolean;
  lastPasswordChange: Date;
}
