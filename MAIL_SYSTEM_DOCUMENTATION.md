# CareerBridge AI - Mail System Documentation

## Overview

The CareerBridge AI platform uses a modular mail system built with **Handlebars templates** and **nodemailer-express-handlebars**. This approach separates email logic from presentation, making it easy to maintain, update, and customize email templates.

## Architecture

```
src/mail/
├── mail.module.ts              # Mail module (Global)
├── mail.service.ts             # Main mail service
├── helpers/
│   └── handlebars-helpers.ts   # Custom Handlebars helpers
└── templates/
    ├── layouts/
    │   └── main.hbs           # Main email layout
    ├── partials/              # Reusable template parts
    ├── email-verification.hbs  # Email verification template
    ├── password-reset.hbs      # Password reset template
    ├── two-factor-code.hbs     # 2FA code template
    ├── security-alert.hbs      # Security alert template
    ├── welcome.hbs             # Welcome email template
    ├── account-deactivation.hbs # Account deactivation template
    └── account-reactivation.hbs # Account reactivation template
```

## Features

### ✨ Template System

- **Handlebars templates** with custom helpers
- **Responsive HTML layouts** with professional styling
- **Role-specific content** based on user roles
- **Reusable components** and partials
- **Dynamic content** generation

### 🎨 Email Templates

- **Email Verification** - Welcome new users with role-specific features
- **Password Reset** - Secure password reset with security guidelines
- **Two-Factor Authentication** - TOTP codes with security context
- **Security Alerts** - Suspicious activity notifications
- **Welcome Email** - Post-verification welcome with getting started tips
- **Account Management** - Deactivation and reactivation workflows

### 🛡️ Security Features

- **Professional layouts** with consistent branding
- **Security context** in all communications
- **IP address and location tracking** in notifications
- **Best practices guidance** in security-related emails
- **Anti-phishing measures** with legitimate action buttons

## Quick Start

### 1. Install Dependencies

```bash
npm install nodemailer-express-handlebars express-handlebars
npm install @types/nodemailer-express-handlebars
```

### 2. Environment Configuration

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Settings
FROM_EMAIL=noreply@careerbridge.ai
FRONTEND_URL=http://localhost:3000
```

### 3. Basic Usage

```typescript
import { MailService } from '../mail/mail.service';

@Injectable()
export class YourService {
  constructor(private mailService: MailService) {}

  async sendWelcome() {
    await this.mailService.sendWelcomeEmail(
      'user@example.com',
      'John',
      UserRole.STUDENT,
    );
  }
}
```

## Mail Service API

### Core Methods

#### Email Verification

```typescript
await mailService.sendEmailVerification(
  email: string,
  firstName: string,
  verificationCode: string,
  role: UserRole
);
```

#### Password Reset

```typescript
await mailService.sendPasswordReset(
  email: string,
  firstName: string,
  resetCode: string
);
```

#### Two-Factor Authentication

```typescript
await mailService.sendTwoFactorCode(
  email: string,
  firstName: string,
  code: string,
  metadata?: {
    ipAddress?: string;
    location?: string;
    deviceInfo?: string;
  }
);
```

#### Security Alerts

```typescript
await mailService.sendSecurityAlert(
  email: string,
  firstName: string,
  alertType: string,
  details: string,
  metadata?: {
    ipAddress?: string;
    location?: string;
    userAgent?: string;
  }
);
```

#### Welcome Email

```typescript
await mailService.sendWelcomeEmail(
  email: string,
  firstName: string,
  role: UserRole
);
```

#### Account Management

```typescript
await mailService.sendAccountDeactivation(
  email: string,
  firstName: string,
  reason?: string
);

await mailService.sendAccountReactivation(
  email: string,
  firstName: string,
  reactivationCode: string
);
```

#### Custom Emails

```typescript
await mailService.sendCustomEmail(
  to: string | string[],
  subject: string,
  template: string,
  context: Record<string, any>,
  attachments?: any[]
);
```

#### Bulk Operations

```typescript
await mailService.sendBulkEmail(
  recipients: string[],
  subject: string,
  template: string,
  context: Record<string, any>
);
```

## Handlebars Helpers

### Built-in Helpers

#### Comparison

```handlebars
{{#eq role 'STUDENT'}}
  Student-specific content
{{/eq}}

{{#neq status 'ACTIVE'}}
  Account not active
{{/neq}}
```

#### Role Management

```handlebars
{{getRoleDisplayName role}}
{{#each (getRoleFeatures role)}}
  <li>{{this}}</li>
{{/each}}
```

#### Date Formatting

```handlebars
{{formatDate createdAt}}
{{timeAgo lastLogin}}
```

#### String Manipulation

```handlebars
{{capitalize firstName}}
{{truncate description 100}}
```

#### Conditional Logic

```handlebars
{{#if_eq role 'EMPLOYER'}}
  Employer content
{{else}}
  Other user content
{{/if_eq}}
```

### Role-Specific Features

The system automatically provides role-specific features and content:

#### Student Features

- Browse job opportunities and internships
- Apply for positions with one click
- Connect with alumni and mentors
- Join student forums and events
- Build professional profile
- Access career resources

#### Employer Features

- Post job opportunities
- Search and recruit candidates
- Create detailed company profiles
- Host virtual recruitment events
- Access talent pipeline
- Build employer brand

#### Alumni Features

- Mentor current students
- Share job opportunities
- Create networking events
- Access exclusive alumni resources
- Connect with fellow alumni
- Give back to community

## Template Customization

### Creating New Templates

1. **Create Template File**

```handlebars
<!-- src/mail/templates/my-template.hbs -->
<p>Hello {{firstName}},</p>

<p>Your custom message here.</p>

<div class='alert alert-info'>
  <strong>Note:</strong>
  {{customMessage}}
</div>

<a href='{{actionUrl}}' class='button'>Take Action</a>
```

2. **Add Service Method**

```typescript
async sendCustomNotification(
  email: string,
  firstName: string,
  customMessage: string,
  actionUrl: string
): Promise<boolean> {
  return this.sendEmail({
    to: email,
    subject: 'Custom Notification',
    template: 'my-template',
    context: {
      firstName,
      customMessage,
      actionUrl,
    },
  });
}
```

### Template Structure

All templates use the main layout (`layouts/main.hbs`) which provides:

- Professional HTML structure
- Responsive CSS styling
- Header with branding
- Footer with links
- Consistent typography

### Styling Guidelines

The main layout includes comprehensive CSS with:

- **Responsive design** for all devices
- **Professional color scheme** (purple gradients)
- **Typography** optimized for readability
- **Button styles** for call-to-actions
- **Alert boxes** for important information
- **Code containers** for verification codes

## Configuration

### SMTP Settings

```typescript
// Automatic configuration in MailService
const transporter = nodemailer.createTransporter({
  host: configService.get('SMTP_HOST'),
  port: configService.get('SMTP_PORT'),
  secure: configService.get('SMTP_SECURE'),
  auth: {
    user: configService.get('SMTP_USER'),
    pass: configService.get('SMTP_PASS'),
  },
});
```

### Template Configuration

```typescript
// Handlebars configuration
transporter.use(
  'compile',
  hbs({
    viewEngine: {
      extname: '.hbs',
      partialsDir: path.resolve(__dirname, 'templates/partials'),
      layoutsDir: path.resolve(__dirname, 'templates/layouts'),
      defaultLayout: 'main',
      helpers: handlebarsHelpers,
    },
    viewPath: path.resolve(__dirname, 'templates'),
    extName: '.hbs',
  }),
);
```

## Testing

### Email Configuration Test

```typescript
const isConfigured = await mailService.verifyEmailConfiguration();
const stats = await mailService.getEmailStatistics();
```

### Development Testing

For development, you can use:

- **Mailtrap** for email testing
- **Gmail** with app passwords
- **Local SMTP server** for testing

Example Mailtrap configuration:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
```

## Production Considerations

### Email Service Providers

- **SendGrid** - Reliable, scalable
- **Amazon SES** - Cost-effective
- **Mailgun** - Developer-friendly
- **Gmail SMTP** - Simple setup

### Security Best Practices

- Use **app passwords** for Gmail
- Enable **2FA** on email accounts
- Use **environment variables** for credentials
- Implement **rate limiting** for email sending
- Monitor **email reputation** and deliverability

### Performance Optimization

- Use **email queues** for bulk operations
- Implement **retry logic** for failed sends
- Cache **template compilation** results
- Monitor **send success rates**

## Monitoring and Logging

The MailService includes comprehensive logging:

- **Successful sends** with message IDs
- **Failed sends** with error details
- **Template usage** tracking
- **Configuration status** monitoring

```typescript
// Example log output
[MailService] Email sent successfully to user@example.com {
  messageId: '<message-id>',
  template: 'email-verification'
}
```

## Integration with Enhanced Auth

The Mail system is tightly integrated with the Enhanced Authentication system:

```typescript
// In EnhancedAuthService
await this.mailService.sendEmailVerification(
  user.email,
  user.firstName,
  verificationCode,
  user.role,
);
```

This integration provides:

- **Automatic email sending** during auth flows
- **Role-aware content** in all communications
- **Security context** in notifications
- **Consistent branding** across all emails

## Troubleshooting

### Common Issues

1. **SMTP Connection Errors**

   - Verify SMTP credentials
   - Check network connectivity
   - Ensure correct port settings

2. **Template Not Found**

   - Check file path and name
   - Verify template extension (.hbs)
   - Ensure proper case sensitivity

3. **Helper Function Errors**

   - Verify helper registration
   - Check helper syntax in templates
   - Review helper function logic

4. **Styling Issues**
   - Test email clients individually
   - Use inline CSS for critical styles
   - Test responsive design

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

This provides detailed information about:

- Template compilation
- SMTP connections
- Email sending process
- Error stack traces

## Migration from Old Email System

If migrating from the old hardcoded email system:

1. **Replace service imports**

   ```typescript
   // Old
   import { EmailService } from './email.service';

   // New
   import { MailService } from '../mail/mail.service';
   ```

2. **Update method calls**

   ```typescript
   // Old
   await this.emailService.sendEmailVerification(...);

   // New
   await this.mailService.sendEmailVerification(...);
   ```

3. **Remove old template strings**

   - Templates are now in separate .hbs files
   - No need for hardcoded HTML strings
   - Styling is handled by the layout

4. **Update module imports**
   ```typescript
   // Add MailModule to your module imports
   imports: [MailModule];
   ```

## Conclusion

The new Mail system provides:

- **Clean separation** of concerns
- **Professional templates** with consistent branding
- **Role-aware content** for personalized communications
- **Security-focused** messaging
- **Easy maintenance** and customization
- **Type-safe** integration with TypeScript

This system scales well and provides a solid foundation for all email communications in the CareerBridge AI platform.
