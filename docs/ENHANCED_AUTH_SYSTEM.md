# CareerBridge AI - Enhanced Authentication System 🔐

## Overview

The CareerBridge AI platform features a comprehensive, enterprise-grade authentication system designed with security, scalability, and user experience in mind. This system goes far beyond basic login/register functionality to provide a robust security framework that protects user accounts and platform integrity.

## 🚀 Key Features

### 1. **Multi-Factor Authentication (2FA)**

- **TOTP (Time-based One-Time Password)** support via authenticator apps
- **SMS/Email-based verification codes** as fallback
- **Backup codes** for account recovery
- **QR Code generation** for easy setup

### 2. **Advanced Password Security**

- **Strong password requirements** with validation
- **Password history tracking** to prevent reuse
- **Secure password reset** with time-limited codes
- **Password expiration** notifications
- **Bcrypt hashing** with salt rounds of 12

### 3. **Account Protection**

- **Rate limiting** to prevent brute force attacks
- **Account lockout** after failed login attempts
- **IP-based tracking** and suspicious activity detection
- **Email verification** for new accounts
- **Account deactivation/reactivation** workflow

### 4. **Session Management**

- **JWT-based authentication** with refresh tokens
- **Session tracking** across multiple devices
- **Device fingerprinting** for trusted devices
- **Remote session termination**
- **Remember me** functionality with extended sessions

### 5. **Security Auditing**

- **Comprehensive logging** of all security events
- **Login attempt tracking** with success/failure rates
- **Security notifications** via email
- **Real-time monitoring** of suspicious activities
- **Audit trail** for compliance

## 🏗️ Architecture

### Database Schema

The enhanced authentication system adds several new models to support advanced features:

```sql
-- Verification codes for email/2FA/password reset
model VerificationCode {
  id        String   @id @default(uuid())
  email     String
  code      String
  type      String   -- 'email_verification', 'password_reset', 'two_factor'
  expiresAt DateTime
  attempts  Int      @default(0)
}

-- User session tracking
model UserSession {
  id           String   @id @default(uuid())
  userId       String
  deviceName   String?
  ipAddress    String?
  userAgent    String?
  isActive     Boolean  @default(true)
  lastActivity DateTime @default(now())
}

-- Two-factor authentication
model TwoFactorAuth {
  id          String  @id @default(uuid())
  userId      String  @unique
  secret      String  -- TOTP secret
  isConfirmed Boolean @default(false)
}

-- Account lockout protection
model AccountLockout {
  id                String    @id @default(uuid())
  email             String    @unique
  failedAttempts    Int       @default(0)
  lockedUntil       DateTime?
  ipAddress         String?
}

-- Security event logging
model SecurityLog {
  id        String   @id @default(uuid())
  userId    String
  event     String   -- 'LOGIN_SUCCESS', 'PASSWORD_CHANGED', etc.
  ipAddress String?
  metadata  Json?
  timestamp DateTime @default(now())
}
```

### Service Architecture

```
EnhancedAuthService
├── Email Verification
├── Password Management
├── Two-Factor Authentication
├── Session Management
├── Account Management
└── Security Auditing

EmailService
├── Verification Emails
├── Password Reset Emails
├── Security Alerts
├── Welcome Messages
└── Account Notifications

RateLimitGuard
├── IP-based Rate Limiting
├── Email-based Rate Limiting
├── User-based Rate Limiting
└── Endpoint-specific Limits
```

## 🔒 Security Features

### Rate Limiting Configuration

```typescript
// Login attempts: 5 per 15 minutes
'POST /auth/login': {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
}

// Registration: 3 per hour
'POST /auth/register': {
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
}

// Password reset: 3 per hour
'POST /auth/forgot-password': {
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
}
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Cannot reuse last 5 passwords

### Account Lockout Policy

- **5 failed login attempts** triggers lockout
- **15-minute lockout duration**
- **IP tracking** for suspicious activities
- **Email notifications** for lockout events

## 📧 Email Integration

### Supported Email Types

1. **Email Verification** - Account activation
2. **Password Reset** - Secure password recovery
3. **Two-Factor Codes** - 2FA verification
4. **Security Alerts** - Suspicious activity notifications
5. **Welcome Messages** - Onboarding communication
6. **Account Status** - Deactivation/reactivation notices

### Email Configuration

```typescript
// Environment variables required
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@careerbridge.ai
```

## 🛡️ API Endpoints

### Authentication Endpoints

#### Registration & Verification

```http
POST /auth/register              # Enhanced user registration
POST /auth/verify-email          # Email verification
POST /auth/resend-verification   # Resend verification code
```

#### Login & Authentication

```http
POST /auth/login                 # Enhanced login with 2FA support
POST /auth/refresh              # Refresh access tokens
POST /auth/logout               # Secure logout
GET  /auth/me                   # Get current user
```

#### Password Management

```http
POST /auth/forgot-password      # Request password reset
POST /auth/reset-password       # Reset password with code
POST /auth/change-password      # Change current password
```

#### Two-Factor Authentication

```http
POST /auth/2fa/enable           # Enable 2FA
POST /auth/2fa/verify-setup     # Verify 2FA setup
POST /auth/2fa/disable          # Disable 2FA
GET  /auth/2fa/status          # Get 2FA status
```

#### Account Management

```http
POST /auth/deactivate           # Deactivate account
POST /auth/request-reactivation # Request reactivation
POST /auth/reactivate          # Reactivate account
```

#### Session Management

```http
GET    /auth/sessions           # Get all sessions
DELETE /auth/sessions/:id       # Revoke specific session
DELETE /auth/sessions           # Revoke all sessions
```

#### Security & Audit

```http
GET /auth/security-audit        # Get security audit info
GET /auth/health               # Service health check
GET /auth/verify-token         # Verify JWT token
```

## 🔧 Usage Examples

### Enhanced Registration

```typescript
const registerData = {
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  role: 'STUDENT',
  university: 'MIT',
  major: 'Computer Science',
  graduationYear: 2025,
  agreeToTerms: true,
  subscribeToNewsletter: false,
};

const response = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(registerData),
});
```

### Enhanced Login

```typescript
const loginData = {
  email: 'john.doe@example.com',
  password: 'SecurePass123!',
  twoFactorCode: '123456', // If 2FA is enabled
  rememberMe: true,
  deviceName: 'iPhone 13 Pro',
};

const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loginData),
});
```

### Enable Two-Factor Authentication

```typescript
// Step 1: Enable 2FA
const enable2FA = await fetch('/auth/2fa/enable', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + accessToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phoneNumber: '+1234567890',
  }),
});

const { qrCode, backupCodes } = await enable2FA.json();

// Step 2: Verify setup
const verify2FA = await fetch('/auth/2fa/verify-setup', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + accessToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    verificationCode: '123456',
  }),
});
```

## 📊 Security Monitoring

### Security Events Tracked

- `REGISTRATION` - New user registration
- `EMAIL_VERIFIED` - Email verification completed
- `LOGIN_SUCCESS` - Successful login
- `LOGIN_FAILED` - Failed login attempt
- `PASSWORD_CHANGED` - Password updated
- `PASSWORD_RESET_REQUESTED` - Password reset initiated
- `PASSWORD_RESET_COMPLETED` - Password reset completed
- `TWO_FACTOR_ENABLED` - 2FA activated
- `TWO_FACTOR_DISABLED` - 2FA deactivated
- `ACCOUNT_DEACTIVATED` - Account deactivated
- `ACCOUNT_REACTIVATED` - Account reactivated
- `SESSION_REVOKED` - Session terminated

### Security Audit Response

```typescript
{
  lastLoginAt: "2024-01-15T10:30:00Z",
  loginAttempts: 15,
  failedAttempts: 2,
  activeSessions: 3,
  trustedDevices: 2,
  twoFactorEnabled: true,
  lastPasswordChange: "2024-01-01T08:00:00Z"
}
```

## 🚨 Error Handling

### Common Error Responses

```typescript
// Rate limit exceeded
{
  statusCode: 429,
  message: "Too many requests. Try again in 300 seconds.",
  error: "Too Many Requests"
}

// Invalid credentials
{
  statusCode: 401,
  message: "Invalid credentials",
  error: "Unauthorized"
}

// Account locked
{
  statusCode: 403,
  message: "Account is locked. Try again in 15 minutes.",
  error: "Forbidden"
}

// 2FA required
{
  statusCode: 200,
  user: null,
  tokens: null,
  requiresTwoFactor: true
}
```

## 🔧 Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=CareerBridge
JWT_AUDIENCE=CareerBridge-Users

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@careerbridge.ai

# Security Configuration
SKIP_RATE_LIMIT=false
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000
VERIFICATION_CODE_EXPIRY=900000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/careerbridge
```

## 🔄 Migration Guide

### Updating from Basic Auth

1. **Database Migration**

   ```bash
   npx prisma migrate dev --name enhanced-auth
   ```

2. **Update Dependencies**

   ```bash
   npm install @nestjs/jwt @nestjs/passport passport-jwt
   npm install speakeasy nodemailer
   npm install @types/speakeasy @types/nodemailer
   ```

3. **Environment Setup**

   ```bash
   # Copy .env.example to .env
   cp .env.example .env

   # Update environment variables
   nano .env
   ```

4. **Module Integration**

   ```typescript
   import { EnhancedAuthModule } from './auth/enhanced-auth.module';

   @Module({
     imports: [EnhancedAuthModule],
   })
   export class AppModule {}
   ```

## 🧪 Testing

### Security Test Cases

1. **Rate Limiting Tests**

   - Verify login rate limits
   - Test registration limits
   - Validate password reset limits

2. **2FA Tests**

   - TOTP code generation/verification
   - Backup code functionality
   - 2FA disable process

3. **Session Management Tests**

   - Token refresh workflow
   - Session termination
   - Multi-device sessions

4. **Security Audit Tests**
   - Event logging accuracy
   - Audit data completeness
   - Security metrics calculation

## 📈 Performance Considerations

### Optimization Strategies

1. **Database Indexing**

   ```sql
   CREATE INDEX idx_security_log_user_timestamp ON SecurityLog(userId, timestamp);
   CREATE INDEX idx_user_session_user_active ON UserSession(userId, isActive);
   CREATE INDEX idx_verification_code_email_type ON VerificationCode(email, type);
   ```

2. **Caching Strategy**

   - Rate limit data in Redis
   - User session caching
   - 2FA secret caching

3. **Email Queue**
   - Async email sending
   - Email template caching
   - Delivery status tracking

## 🛠️ Monitoring & Maintenance

### Health Checks

```http
GET /auth/health
```

Response:

```json
{
  "status": "ok",
  "service": "Enhanced Authentication Service",
  "timestamp": "2024-01-15T10:30:00Z",
  "features": [
    "Email Verification",
    "Two-Factor Authentication",
    "Password Reset",
    "Session Management",
    "Account Lockout Protection",
    "Security Auditing"
  ]
}
```

### Metrics to Monitor

- Login success/failure rates
- 2FA adoption rates
- Account lockout frequency
- Email delivery rates
- Session duration analytics
- Security event patterns

## 🔐 Security Best Practices

1. **Token Management**

   - Use secure token storage
   - Implement token rotation
   - Monitor token abuse

2. **Rate Limiting**

   - Implement progressive delays
   - Use distributed rate limiting for scaling
   - Monitor bypass attempts

3. **Email Security**

   - Use SPF/DKIM/DMARC
   - Monitor email reputation
   - Implement email encryption

4. **Logging & Monitoring**
   - Log all security events
   - Set up security alerts
   - Regular security audits

## 📚 Additional Resources

- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Two-Factor Authentication Guide](https://www.nist.gov/itl/applied-cybersecurity/tig/back-basics-multi-factor-authentication)
- [Rate Limiting Strategies](https://konghq.com/blog/how-to-design-a-scalable-rate-limiting-algorithm)

---

_This enhanced authentication system provides enterprise-grade security while maintaining excellent user experience. For questions or support, please refer to the development team._
