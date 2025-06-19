# Enhanced Authentication System - Quick Setup Guide 🚀

## Prerequisites

Before setting up the enhanced authentication system, ensure you have:

- Node.js (v16 or higher)
- PostgreSQL database
- SMTP server for email (Gmail, SendGrid, etc.)
- Redis (optional, for caching)

## Installation Steps

### 1. Install Required Dependencies

```bash
npm install @nestjs/jwt @nestjs/passport passport-jwt
npm install speakeasy nodemailer qrcode
npm install bcrypt class-validator class-transformer
npm install @types/speakeasy @types/nodemailer @types/qrcode
```

### 2. Database Migration

Run the Prisma migration to add the new authentication tables:

```bash
npx prisma migrate dev --name enhanced-auth-system
npx prisma generate
```

### 3. Environment Configuration

Create or update your `.env` file with the following variables:

```env
# JWT Configuration
JWT_SECRET=your-256-bit-secret-key-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@careerbridge.ai

# Security Settings
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000
SKIP_RATE_LIMIT=false

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/careerbridge
```

### 4. Module Integration

Update your main `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnhancedAuthModule } from './auth/enhanced-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EnhancedAuthModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 5. Update Existing Controllers

If you have existing controllers that need authentication, update them to use the new enhanced auth:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt.guard';
import { CurrentUser } from './auth/decorators/current-user.decorator';

@Controller('protected-resource')
export class SomeController {
  @Get()
  @UseGuards(JwtAuthGuard)
  async getProtectedResource(@CurrentUser() user: any) {
    // Your logic here
    return { user: user.id };
  }
}
```

## Quick Test

### 1. Start the Application

```bash
npm run start:dev
```

### 2. Test Registration

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "role": "STUDENT",
    "agreeToTerms": true
  }'
```

### 3. Check Email Verification

Check your email for the verification code, then verify:

```bash
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "verificationCode": "123456"
  }'
```

### 4. Test Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

## Available Endpoints

Once setup is complete, you'll have access to all these endpoints:

### Authentication

- `POST /auth/register` - Enhanced registration
- `POST /auth/login` - Enhanced login
- `POST /auth/verify-email` - Email verification
- `POST /auth/refresh` - Token refresh
- `GET /auth/me` - Get current user

### Password Management

- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/change-password` - Change password

### Two-Factor Authentication

- `POST /auth/2fa/enable` - Enable 2FA
- `POST /auth/2fa/verify-setup` - Verify 2FA setup
- `POST /auth/2fa/disable` - Disable 2FA

### Session Management

- `GET /auth/sessions` - Get all sessions
- `DELETE /auth/sessions/:id` - Revoke session
- `DELETE /auth/sessions` - Revoke all sessions

### Security

- `GET /auth/security-audit` - Get security audit
- `GET /auth/health` - Health check

## Key Features Enabled

✅ **Email Verification** - New users must verify their email
✅ **Rate Limiting** - Prevents brute force attacks
✅ **Account Lockout** - Temporary lockout after failed attempts
✅ **Password Security** - Strong password requirements
✅ **Session Management** - Multi-device session tracking
✅ **Two-Factor Authentication** - TOTP and backup codes
✅ **Security Auditing** - Comprehensive logging
✅ **Email Notifications** - Security alerts and notifications

## Troubleshooting

### Common Issues

1. **Email Not Sending**

   - Check SMTP credentials
   - Verify Gmail app password if using Gmail
   - Check firewall settings

2. **Database Connection Issues**

   - Verify DATABASE_URL
   - Ensure PostgreSQL is running
   - Check database permissions

3. **JWT Errors**
   - Verify JWT_SECRET is set
   - Check token expiration settings
   - Ensure secrets are secure

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
LOG_LEVEL=debug
```

## Next Steps

1. **Customize Email Templates** - Update email templates in `EmailService`
2. **Configure Rate Limits** - Adjust rate limiting rules in `RateLimitGuard`
3. **Setup Monitoring** - Implement logging and monitoring
4. **Security Review** - Conduct security audit
5. **User Training** - Train users on 2FA and security features

## Support

For issues or questions:

1. Check the comprehensive documentation in `docs/ENHANCED_AUTH_SYSTEM.md`
2. Review the implementation in the auth module
3. Test with the provided examples
4. Contact the development team for assistance

---

🎉 **Congratulations!** Your CareerBridge AI platform now has enterprise-grade authentication security!
