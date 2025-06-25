import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
// import * as hbs from 'nodemailer-express-handlebars';
import hbs from 'nodemailer-express-handlebars';

import * as path from 'path';
import { UserRole } from '@prisma/client';
import { handlebarsHelpers } from './helpers/handlebars-helpers';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
  attachments?: any[];
}

export interface EmailVerificationContext {
  firstName: string;
  email: string;
  verificationToken: string;
  role: UserRole;
  roleDisplayName: string;
  features: string[];
  baseUrl: string;
  currentYear: number;
}

export interface PasswordResetContext {
  firstName: string;
  resetCode: string;
  baseUrl: string;
  currentYear: number;
}

export interface TwoFactorCodeContext {
  firstName: string;
  twoFactorCode: string;
  loginTime: string;
  ipAddress?: string;
  location?: string;
  deviceInfo?: string;
  baseUrl: string;
  currentYear: number;
}

export interface SecurityAlertContext {
  firstName: string;
  alertType: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  location?: string;
  userAgent?: string;
  securityUrl: string;
  baseUrl: string;
  currentYear: number;
}

export interface WelcomeEmailContext {
  firstName: string;
  role: UserRole;
  roleDisplayName: string;
  features: string[];
  dashboardUrl: string;
  baseUrl: string;
  currentYear: number;
}

export interface PasswordSetupContext {
  firstName: string;
  email: string;
  passwordSetupLink: string;
  role: UserRole;
  roleDisplayName: string;
  accountType: string;
  baseUrl: string;
  currentYear: number;
}

export interface AccountReactivationContext {
  firstName: string;
  reactivationCode: string;
  baseUrl: string;
  currentYear: number;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 465),
      secure: this.configService.get<boolean>('SMTP_SECURE', true),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Configure Handlebars
    const templatesPath = path.resolve(
      `${process.cwd()}/src/mail`,
      'templates',
    );
    const layoutsPath = path.resolve(templatesPath, 'layouts');
    const partialsPath = path.resolve(templatesPath, 'partials');

    // Configure handlebars options
    const handlebarOptions = {
      viewEngine: {
        extname: '.hbs',
        partialsDir: partialsPath,
        layoutsDir: layoutsPath,
        defaultLayout: 'main',
        helpers: handlebarsHelpers,
      },
      viewPath: templatesPath,
      extName: '.hbs',
    };

    this.transporter.use('compile', hbs(handlebarOptions));

    this.logger.log('Mail service initialized successfully');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: 'CareerBridge AI',
          address: this.configService.get<string>(
            'FROM_EMAIL',
            'noreply@careerbridge.ai',
          ),
        },
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: {
          ...options.context,
          baseUrl: this.configService.get<string>(
            'FRONTEND_URL',
            'http://localhost:3000',
          ),
          currentYear: new Date().getFullYear(),
        },
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${options.to}`, {
        messageId: result.messageId,
        template: options.template,
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  // ============= EMAIL VERIFICATION =============

  async sendEmailVerification(
    email: string,
    firstName: string,
    verificationToken: string,
    role: UserRole,
  ): Promise<boolean> {
    const context: EmailVerificationContext = {
      firstName,
      email,
      verificationToken,
      role,
      roleDisplayName: handlebarsHelpers.getRoleDisplayName(role),
      features: handlebarsHelpers.getRoleFeatures(role),
      baseUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      ),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: 'Verify Your CareerBridge Account',
      template: 'email-verification',
      context,
    });
  }

  // ============= PASSWORD RESET =============

  async sendPasswordReset(
    email: string,
    firstName: string,
    resetCode: string,
  ): Promise<boolean> {
    const context: PasswordResetContext = {
      firstName,
      resetCode,
      baseUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      ),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: 'Reset Your CareerBridge Password',
      template: 'password-reset',
      context,
    });
  }

  // ============= TWO-FACTOR AUTHENTICATION =============

  async sendTwoFactorCode(
    email: string,
    firstName: string,
    code: string,
    metadata?: {
      ipAddress?: string;
      location?: string;
      deviceInfo?: string;
    },
  ): Promise<boolean> {
    const context: TwoFactorCodeContext = {
      firstName,
      twoFactorCode: code,
      loginTime: handlebarsHelpers.formatDate(new Date()),
      ipAddress: metadata?.ipAddress,
      location: metadata?.location,
      deviceInfo: metadata?.deviceInfo,
      baseUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      ),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: 'CareerBridge Two-Factor Authentication Code',
      template: 'two-factor-code',
      context,
    });
  }

  // ============= SECURITY ALERTS =============

  async sendSecurityAlert(
    email: string,
    firstName: string,
    alertType: string,
    details: string,
    metadata?: {
      ipAddress?: string;
      location?: string;
      userAgent?: string;
    },
  ): Promise<boolean> {
    const context: SecurityAlertContext = {
      firstName,
      alertType,
      details,
      timestamp: handlebarsHelpers.formatDate(new Date()),
      ipAddress: metadata?.ipAddress,
      location: metadata?.location,
      userAgent: metadata?.userAgent,
      securityUrl: `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/security`,
      baseUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      ),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: `CareerBridge Security Alert: ${alertType}`,
      template: 'security-alert',
      context,
    });
  }

  // ============= PASSWORD SETUP EMAIL =============

  async sendPasswordSetupEmail(
    email: string,
    firstName: string,
    passwordSetupLink: string,
    role: UserRole,
  ): Promise<boolean> {
    const context: PasswordSetupContext = {
      firstName,
      email,
      passwordSetupLink,
      role,
      roleDisplayName: handlebarsHelpers.getRoleDisplayName(role),
      accountType:
        role === 'ADMIN'
          ? 'Administrative'
          : role === 'EMPLOYER'
            ? 'Employer'
            : role === 'PROFESSOR'
              ? 'Faculty'
              : role === 'UNIVERSITY_STAFF'
                ? 'University Staff'
                : 'User',
      baseUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      ),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: `Welcome to CareerBridge AI - Set Your Password`,
      template: 'password-setup',
      context,
    });
  }

  // ============= WELCOME EMAIL =============

  async sendWelcomeEmail(
    email: string,
    firstName: string,
    role: UserRole,
  ): Promise<boolean> {
    const baseUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    // Generate role-specific dashboard URL
    const dashboardUrl = this.getRoleDashboardUrl(baseUrl, role);

    const context: WelcomeEmailContext = {
      firstName,
      role,
      roleDisplayName: handlebarsHelpers.getRoleDisplayName(role),
      features: handlebarsHelpers.getRoleFeatures(role),
      dashboardUrl,
      baseUrl,
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: 'Welcome to CareerBridge! 🎉',
      template: 'welcome',
      context,
    });
  }

  /**
   * Generate role-specific dashboard URL
   */
  private getRoleDashboardUrl(baseUrl: string, role: UserRole): string {
    const roleRoutes = {
      [UserRole.STUDENT]: '/dashboard/student',
      [UserRole.ALUMNI]: '/dashboard/student',
      [UserRole.EMPLOYER]: '/dashboard/employer',
      [UserRole.PROFESSOR]: '/dashboard/university',
      [UserRole.MENTOR]: '/dashboard/mentor',
      [UserRole.UNIVERSITY_STAFF]: '/dashboard/university',
      [UserRole.ADMIN]: '/dashboard/admin',
      [UserRole.SUPER_ADMIN]: '/dashboard/admin',
      [UserRole.OTHER]: '/dashboard',
    };

    const route = roleRoutes[role] || '/dashboard';
    return `${baseUrl}${route}`;
  }

  // ============= ACCOUNT MANAGEMENT =============

  async sendAccountDeactivation(
    email: string,
    firstName: string,
    reason?: string,
  ): Promise<boolean> {
    const context = {
      firstName,
      reason,
      baseUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      ),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: 'CareerBridge Account Deactivated',
      template: 'account-deactivation',
      context,
    });
  }

  async sendAccountReactivation(
    email: string,
    firstName: string,
    reactivationCode: string,
  ): Promise<boolean> {
    const context: AccountReactivationContext = {
      firstName,
      reactivationCode,
      baseUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      ),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: 'Reactivate Your CareerBridge Account',
      template: 'account-reactivation',
      context,
    });
  }

  // ============= BULK EMAIL OPERATIONS =============

  async sendBulkEmail(
    recipients: string[],
    subject: string,
    template: string,
    context: Record<string, any>,
  ): Promise<boolean[]> {
    const promises = recipients.map((email) =>
      this.sendEmail({
        to: email,
        subject,
        template,
        context,
      }),
    );

    return Promise.all(promises);
  }

  // ============= EMAIL VERIFICATION =============

  async verifyEmailConfiguration(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email configuration verified successfully');
      return true;
    } catch (error) {
      this.logger.error('Email configuration verification failed:', error);
      return false;
    }
  }

  // ============= TEMPLATE HELPERS =============

  async sendCustomEmail(
    to: string | string[],
    subject: string,
    template: string,
    context: Record<string, any>,
    attachments?: any[],
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject,
      template,
      context,
      attachments,
    });
  }

  // ============= TEST EMAIL =============

  async sendTestEmail(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.sendEmail({
        to: email,
        subject: 'CareerBridge AI - Test Email',
        template: 'notification', // Use a simple template
        context: {
          firstName: 'Test User',
          title: 'Test Email',
          content:
            'This is a test email to verify that the email service is working correctly.',
          actionUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        },
      });

      if (result) {
        return {
          success: true,
          message: `Test email sent successfully to ${email}`,
        };
      } else {
        return {
          success: false,
          message: `Failed to send test email to ${email}`,
        };
      }
    } catch (error) {
      this.logger.error('Test email failed:', error);
      return {
        success: false,
        message: `Test email failed: ${error.message}`,
      };
    }
  }

  // ============= EMAIL STATISTICS =============

  async getEmailStatistics(): Promise<{
    configured: boolean;
    host: string;
    port: number;
    secure: boolean;
    auth: boolean;
  }> {
    return {
      configured: !!this.configService.get('SMTP_HOST'),
      host: this.configService.get('SMTP_HOST', 'localhost'),
      port: this.configService.get('SMTP_PORT', 465),
      secure: this.configService.get('SMTP_SECURE', true),
      auth: !!this.configService.get('SMTP_USER'),
    };
  }

  // ============= EVENT NOTIFICATIONS =============

  async sendEventRegistrationConfirmation(
    email: string,
    firstName: string,
    eventTitle: string,
    eventDate: Date,
    eventLocation: string,
    isWaitlisted: boolean = false,
  ): Promise<boolean> {
    const context = {
      firstName,
      eventTitle,
      eventDate: eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      eventLocation,
      isWaitlisted,
      status: isWaitlisted ? 'waitlisted' : 'confirmed',
      baseUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      ),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: isWaitlisted
        ? `You're on the waitlist for ${eventTitle}`
        : `Registration confirmed for ${eventTitle}`,
      template: 'event-registration-confirmation',
      context,
    });
  }

  async sendEventReminder(
    email: string,
    firstName: string,
    eventTitle: string,
    eventDate: Date,
    eventLocation: string,
    meetingLink?: string,
  ): Promise<boolean> {
    const context = {
      firstName,
      eventTitle,
      eventDate: eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      eventLocation,
      meetingLink,
      hasVirtualComponent: !!meetingLink,
      baseUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      ),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: `Reminder: ${eventTitle} is starting soon`,
      template: 'event-reminder',
      context,
    });
  }

  async sendEventCancellation(
    email: string,
    firstName: string,
    eventTitle: string,
    reason?: string,
  ): Promise<boolean> {
    const context = {
      firstName,
      eventTitle,
      reason,
      hasReason: !!reason,
      baseUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      ),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: `Event Cancelled: ${eventTitle}`,
      template: 'event-cancellation',
      context,
    });
  }

  async sendEventUpdate(
    email: string,
    firstName: string,
    eventTitle: string,
    updateType: string,
    updateDetails: string,
  ): Promise<boolean> {
    const context = {
      firstName,
      eventTitle,
      updateType,
      updateDetails,
      baseUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      ),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: `Update: ${eventTitle}`,
      template: 'event-update',
      context,
    });
  }

  async sendEventFeedbackRequest(
    email: string,
    firstName: string,
    eventTitle: string,
    eventId: string,
  ): Promise<boolean> {
    const context = {
      firstName,
      eventTitle,
      eventId,
      feedbackUrl: `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/events/${eventId}/feedback`,
      baseUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      ),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: `Share your feedback: ${eventTitle}`,
      template: 'event-feedback-request',
      context,
    });
  }

  async sendEventNetworkingMatch(
    email: string,
    firstName: string,
    eventTitle: string,
    matchName: string,
    matchProfile: string,
    commonInterests: string[],
  ): Promise<boolean> {
    const context = {
      firstName,
      eventTitle,
      matchName,
      matchProfile,
      commonInterests,
      baseUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      ),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: email,
      subject: `New networking match at ${eventTitle}`,
      template: 'event-networking-match',
      context,
    });
  }
}
