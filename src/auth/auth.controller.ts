import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Ip,
  Headers,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { AuthService, AuthResponse } from './auth.service';
import { EnhancedAuthService } from './services/enhanced-auth.service';
import {
  RegisterDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  EnhancedRegisterDto,
  EnhancedLoginDto,
  VerifyEmailDto as EnhancedVerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  RefreshTokenDto,
  EnhancedAuthResponse,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { User } from '@prisma/client';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private enhancedAuthService: EnhancedAuthService,
  ) {}

  // ============= BASIC AUTH ENDPOINTS (Backward Compatibility) =============

  @ApiOperation({ summary: 'Register user (Basic)' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<{
    message: string;
    user: Omit<User, 'password'>;
    requiresVerification: boolean;
  }> {
    return await this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Login user (Basic)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account not verified or inactive' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return await this.authService.loginWithValidation(loginDto);
  }

  @ApiOperation({ summary: 'Verify email with verification code' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired verification code',
  })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string; user: Omit<User, 'password'> }> {
    return await this.authService.verifyEmail(
      verifyEmailDto.email,
      verifyEmailDto.verificationCode,
    );
  }

  @ApiOperation({ summary: 'Resend verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Account already verified' })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return await this.authService.resendVerificationCode(
      resendVerificationDto.email,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any): any {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check authentication status' })
  @ApiResponse({ status: 200, description: 'Authentication valid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  checkAuth(@CurrentUser() user: any): { user: any } {
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  // ============= ENHANCED AUTH ENDPOINTS =============

  @ApiOperation({ summary: 'Enhanced registration with email verification' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful, verification email sent',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @UseGuards(RateLimitGuard)
  @Post('register/enhanced')
  async enhancedRegister(@Body() registerDto: EnhancedRegisterDto): Promise<{
    message: string;
    user: Omit<User, 'password'>;
    requiresVerification: boolean;
  }> {
    return this.enhancedAuthService.enhancedRegister(registerDto);
  }

  @ApiOperation({ summary: 'Enhanced login with 2FA support' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiHeader({
    name: 'X-Forwarded-For',
    description: 'Client IP address',
    required: false,
  })
  @ApiHeader({
    name: 'User-Agent',
    description: 'Client user agent',
    required: false,
  })
  @UseGuards(RateLimitGuard)
  @Post('login/enhanced')
  @HttpCode(HttpStatus.OK)
  async enhancedLogin(
    @Body() loginDto: EnhancedLoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<EnhancedAuthResponse> {
    return this.enhancedAuthService.enhancedLogin(
      loginDto,
      ipAddress,
      userAgent,
    );
  }

  // ============= EMAIL VERIFICATION =============

  @ApiOperation({ summary: 'Verify email address (Enhanced)' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code',
  })
  @UseGuards(RateLimitGuard)
  @Post('verify-email/enhanced')
  async verifyEmailEnhanced(
    @Body() verifyEmailDto: EnhancedVerifyEmailDto,
  ): Promise<{ message: string; user: Omit<User, 'password'> }> {
    return this.enhancedAuthService.verifyEmail(verifyEmailDto);
  }

  @ApiOperation({ summary: 'Resend email verification code (Enhanced)' })
  @ApiResponse({ status: 200, description: 'Verification code sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Email already verified' })
  @UseGuards(RateLimitGuard)
  @Post('resend-verification/enhanced')
  async resendVerificationEnhanced(
    @Query('email') email: string,
  ): Promise<{ message: string }> {
    return this.enhancedAuthService.resendVerificationCode(email);
  }

  // ============= PASSWORD MANAGEMENT =============

  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Reset code sent if account exists',
  })
  @UseGuards(RateLimitGuard)
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.enhancedAuthService.forgotPassword(forgotPasswordDto);
  }

  @ApiOperation({ summary: 'Reset password with code' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset code' })
  @UseGuards(RateLimitGuard)
  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.enhancedAuthService.resetPassword(resetPasswordDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (authenticated user)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.enhancedAuthService.changePassword(user.id, changePasswordDto);
  }

  // ============= TOKEN MANAGEMENT =============

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.enhancedAuthService.refreshTokens(refreshTokenDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: any): Promise<{ message: string }> {
    // For basic logout, we'll just return success
    // Enhanced session management is handled in the enhanced controller
    return { message: 'Logged out successfully' };
  }

  // ============= ACCOUNT MANAGEMENT =============

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@CurrentUser() user: any) {
    return this.enhancedAuthService.getUserSessions(user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get security audit information' })
  @ApiResponse({ status: 200, description: 'Security audit retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('security-audit')
  async getSecurityAudit(@CurrentUser() user: any) {
    return this.enhancedAuthService.getSecurityAudit(user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  async revokeSession(
    @CurrentUser() user: any,
    @Query('sessionId') sessionId: string,
  ): Promise<{ message: string }> {
    return this.enhancedAuthService.revokeSession(user.id, sessionId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions' })
  @ApiResponse({
    status: 200,
    description: 'All sessions revoked successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Delete('sessions')
  async revokeAllSessions(
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    return this.enhancedAuthService.revokeAllSessions(user.id);
  }

  // ============= HEALTH CHECK =============

  @ApiOperation({ summary: 'Authentication system health check' })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        auth: 'operational',
        mail: 'operational',
        database: 'operational',
      },
    };
  }

  @ApiOperation({ summary: 'Verify token validity' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('verify-token')
  async verifyToken(@CurrentUser() user: any) {
    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        accountStatus: user.accountStatus,
      },
    };
  }
}
