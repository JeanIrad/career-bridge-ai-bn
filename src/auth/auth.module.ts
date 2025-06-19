import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Controllers
import { AuthController } from './auth.controller';
import { TwoFactorController } from './controllers/two-factor.controller';
import { AccountController } from './controllers/account.controller';

// Services
import { AuthService } from './auth.service';
import { EnhancedAuthService } from './services/enhanced-auth.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';

// Guards
import { JwtAuthGuard } from './guards/jwt.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';

// Modules
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UsersModule),
    PrismaModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'defaultSecret'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1h'),
          issuer: configService.get<string>('JWT_ISSUER', 'CareerBridge'),
          audience: configService.get<string>(
            'JWT_AUDIENCE',
            'CareerBridge-Users',
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, TwoFactorController, AccountController],
  providers: [
    // Core Services
    AuthService,
    EnhancedAuthService,

    // Authentication Strategy
    JwtStrategy,

    // Guards
    JwtAuthGuard,
    RateLimitGuard,
  ],
  exports: [
    AuthService,
    EnhancedAuthService,
    JwtAuthGuard,
    RateLimitGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
