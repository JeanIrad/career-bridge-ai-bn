import { Controller, Post, Body, UseGuards, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { EnhancedAuthService } from '../services/enhanced-auth.service';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { DeactivateAccountDto, ReactivateAccountDto } from '../dto/auth.dto';

@ApiTags('Account Management')
@Controller('auth/account')
export class AccountController {
  constructor(private enhancedAuthService: EnhancedAuthService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @Post('deactivate')
  async deactivateAccount(
    @CurrentUser() user: any,
    @Body() deactivateAccountDto: DeactivateAccountDto,
  ): Promise<{ message: string }> {
    return this.enhancedAuthService.deactivateAccount(
      user.id,
      deactivateAccountDto,
    );
  }

  @ApiOperation({ summary: 'Request account reactivation' })
  @ApiResponse({
    status: 200,
    description: 'Reactivation code sent if account exists',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'If an account with this email exists, a reactivation code has been sent.',
        },
      },
    },
  })
  @UseGuards(RateLimitGuard)
  @Post('request-reactivation')
  async requestReactivation(
    @Query('email') email: string,
  ): Promise<{ message: string }> {
    return this.enhancedAuthService.requestAccountReactivation(email);
  }

  @ApiOperation({ summary: 'Reactivate account with code' })
  @ApiResponse({ status: 200, description: 'Account reactivated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reactivation code',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(RateLimitGuard)
  @Post('reactivate')
  async reactivateAccount(
    @Body() reactivateAccountDto: ReactivateAccountDto,
  ): Promise<{ message: string }> {
    return this.enhancedAuthService.reactivateAccount(reactivateAccountDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get account status and information' })
  @ApiResponse({
    status: 200,
    description: 'Account information retrieved',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        isVerified: { type: 'boolean' },
        accountStatus: {
          type: 'string',
          enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        },
        role: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        lastLogin: { type: 'string', format: 'date-time' },
        twoFactorEnabled: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('status')
  async getAccountStatus(@CurrentUser() user: any) {
    const securityAudit = await this.enhancedAuthService.getSecurityAudit(
      user.id,
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: securityAudit.lastLoginAt,
      twoFactorEnabled: securityAudit.twoFactorEnabled,
      activeSessions: securityAudit.activeSessions,
      lastPasswordChange: securityAudit.lastPasswordChange,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download account data (GDPR compliance)' })
  @ApiResponse({
    status: 200,
    description: 'Account data package',
    schema: {
      type: 'object',
      properties: {
        userData: { type: 'object', description: 'All user data' },
        exportDate: { type: 'string', format: 'date-time' },
        format: { type: 'string', example: 'JSON' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @Post('export-data')
  async exportAccountData(@CurrentUser() user: any) {
    // This would need to be implemented to gather all user data
    // from various services and tables for GDPR compliance

    const userData = {
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      // Additional data would be gathered from other services
      // like education, experience, skills, etc.
    };

    return {
      userData,
      exportDate: new Date().toISOString(),
      format: 'JSON',
      message: 'Account data exported successfully',
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request account deletion (GDPR compliance)' })
  @ApiResponse({ status: 200, description: 'Account deletion requested' })
  @ApiResponse({ status: 400, description: 'Invalid password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @Post('request-deletion')
  async requestAccountDeletion(
    @CurrentUser() user: any,
    @Body() deleteRequest: { password: string; reason?: string },
  ) {
    // This would need to be implemented with proper verification
    // and a grace period before actual deletion

    return {
      message:
        'Account deletion requested. You will receive a confirmation email with a 30-day grace period.',
      deletionDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      gracePeriod: '30 days',
    };
  }
}
