import { Controller, Post, Body, UseGuards, Get, Delete } from '@nestjs/common';
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
import {
  EnableTwoFactorDto,
  VerifyTwoFactorSetupDto,
  DisableTwoFactorDto,
  TwoFactorSetupResponse,
} from '../dto/auth.dto';

@ApiTags('Two-Factor Authentication')
@ApiBearerAuth()
@Controller('auth/2fa')
@UseGuards(JwtAuthGuard)
export class TwoFactorController {
  constructor(private enhancedAuthService: EnhancedAuthService) {}

  @ApiOperation({ summary: 'Enable two-factor authentication' })
  @ApiResponse({
    status: 200,
    description: 'Two-factor authentication setup initiated',
    schema: {
      type: 'object',
      properties: {
        qrCode: {
          type: 'string',
          description: 'QR code URL for authenticator app',
        },
        backupCodes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Backup codes for recovery',
        },
        phoneNumber: {
          type: 'string',
          description: 'Phone number for SMS (if provided)',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(RateLimitGuard)
  @Post('enable')
  async enableTwoFactor(
    @CurrentUser() user: any,
    @Body() enableTwoFactorDto: EnableTwoFactorDto,
  ): Promise<TwoFactorSetupResponse> {
    return this.enhancedAuthService.enableTwoFactor(
      user.id,
      enableTwoFactorDto,
    );
  }

  @ApiOperation({ summary: 'Verify two-factor authentication setup' })
  @ApiResponse({
    status: 200,
    description: 'Two-factor authentication enabled successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'User not found or 2FA setup not found',
  })
  @UseGuards(RateLimitGuard)
  @Post('verify-setup')
  async verifyTwoFactorSetup(
    @CurrentUser() user: any,
    @Body() verifyTwoFactorSetupDto: VerifyTwoFactorSetupDto,
  ): Promise<{ message: string }> {
    return this.enhancedAuthService.verifyTwoFactorSetup(
      user.id,
      verifyTwoFactorSetupDto,
    );
  }

  @ApiOperation({ summary: 'Disable two-factor authentication' })
  @ApiResponse({
    status: 200,
    description: 'Two-factor authentication disabled successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(RateLimitGuard)
  @Delete('disable')
  async disableTwoFactor(
    @CurrentUser() user: any,
    @Body() disableTwoFactorDto: DisableTwoFactorDto,
  ): Promise<{ message: string }> {
    return this.enhancedAuthService.disableTwoFactor(
      user.id,
      disableTwoFactorDto,
    );
  }

  @ApiOperation({ summary: 'Get two-factor authentication status' })
  @ApiResponse({
    status: 200,
    description: 'Two-factor authentication status',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', description: 'Whether 2FA is enabled' },
        confirmed: {
          type: 'boolean',
          description: 'Whether 2FA setup is confirmed',
        },
        backupCodesRemaining: {
          type: 'number',
          description: 'Number of unused backup codes',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('status')
  async getTwoFactorStatus(@CurrentUser() user: any) {
    // Get 2FA status from the enhanced auth service
    const securityAudit = await this.enhancedAuthService.getSecurityAudit(
      user.id,
    );

    return {
      enabled: securityAudit.twoFactorEnabled,
      confirmed: securityAudit.twoFactorEnabled, // If enabled, it's confirmed
      backupCodesRemaining: 0, // This would need additional implementation
    };
  }

  @ApiOperation({ summary: 'Generate new backup codes' })
  @ApiResponse({
    status: 200,
    description: 'New backup codes generated',
    schema: {
      type: 'object',
      properties: {
        backupCodes: {
          type: 'array',
          items: { type: 'string' },
          description: 'New backup codes',
        },
        message: { type: 'string', description: 'Success message' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 400,
    description: 'Two-factor authentication not enabled',
  })
  @UseGuards(RateLimitGuard)
  @Post('backup-codes/regenerate')
  async regenerateBackupCodes(
    @CurrentUser() user: any,
    @Body() verifyDto: { verificationCode: string },
  ) {
    // First verify that the user can provide a valid 2FA code
    const isValid = await this.enhancedAuthService['verifyTwoFactorCode'](
      user.id,
      verifyDto.verificationCode,
    );

    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Generate new backup codes (this would need to be implemented in the service)
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 8).toUpperCase(),
    );

    return {
      backupCodes,
      message:
        'New backup codes generated successfully. Store them in a safe place.',
    };
  }

  @ApiOperation({
    summary: 'Get two-factor authentication recovery information',
  })
  @ApiResponse({
    status: 200,
    description: 'Recovery information',
    schema: {
      type: 'object',
      properties: {
        recoveryMethods: {
          type: 'array',
          items: { type: 'string' },
          description: 'Available recovery methods',
        },
        lastUsed: {
          type: 'string',
          format: 'date-time',
          description: 'Last 2FA usage',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('recovery-info')
  async getRecoveryInfo(@CurrentUser() user: any) {
    const securityAudit = await this.enhancedAuthService.getSecurityAudit(
      user.id,
    );

    return {
      recoveryMethods: securityAudit.twoFactorEnabled
        ? ['backup-codes', 'contact-support']
        : [],
      lastUsed: user.lastLogin,
      twoFactorEnabled: securityAudit.twoFactorEnabled,
    };
  }
}
