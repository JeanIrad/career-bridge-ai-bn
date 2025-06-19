import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    blocked: boolean;
  };
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly store: RateLimitStore = {};
  private readonly configs: { [endpoint: string]: RateLimitConfig } = {
    // Authentication endpoints
    'POST /auth/login': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      skipSuccessfulRequests: true,
    },
    'POST /auth/register': {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 registration attempts per hour
    },
    'POST /auth/forgot-password': {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 password reset requests per hour
    },
    'POST /auth/reset-password': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 reset attempts per 15 minutes
    },
    'POST /auth/verify-email': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 verification attempts per 15 minutes
    },
    'POST /auth/resend-verification': {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 resend requests per hour
    },
    'POST /auth/2fa/enable': {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 2FA setup attempts per hour
    },
    'POST /auth/2fa/verify-setup': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // 10 verification attempts per 15 minutes
    },
    'POST /auth/2fa/disable': {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 disable attempts per hour
    },
    'POST /auth/verify-2fa': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // 10 2FA verification attempts per 15 minutes
    },
    'POST /auth/refresh': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 20, // 20 refresh attempts per 15 minutes
    },
    // Default for other endpoints
    default: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per 15 minutes
    },
  };

  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse();

    // Skip rate limiting in development mode if configured
    if (
      this.configService.get('NODE_ENV') === 'development' &&
      this.configService.get('SKIP_RATE_LIMIT') === 'true'
    ) {
      return true;
    }

    const key = this.generateKey(request);
    const endpoint = `${request.method} ${request.route?.path || request.path}`;
    const config = this.configs[endpoint] || this.configs.default;

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up old entries
    this.cleanupOldEntries(windowStart);

    // Get or create rate limit entry
    let entry = this.store[key];
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false,
      };
      this.store[key] = entry;
    }

    // Check if already blocked
    if (entry.blocked && entry.resetTime > now) {
      const remainingTime = Math.ceil((entry.resetTime - now) / 1000);
      this.logger.warn(
        `Rate limit exceeded for ${key} on ${endpoint}. Blocked for ${remainingTime}s`,
      );

      response.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
        'Retry-After': remainingTime.toString(),
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Try again in ${remainingTime} seconds.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment request count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      entry.blocked = true;
      const remainingTime = Math.ceil((entry.resetTime - now) / 1000);

      this.logger.warn(
        `Rate limit exceeded for ${key} on ${endpoint}. Blocking for ${remainingTime}s`,
      );

      response.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
        'Retry-After': remainingTime.toString(),
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Try again in ${remainingTime} seconds.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Set rate limit headers
    const remaining = Math.max(0, config.maxRequests - entry.count);
    response.set({
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
    });

    return true;
  }

  private generateKey(request: AuthenticatedRequest): string {
    // Use IP address as primary identifier
    const ip = this.getClientIp(request);

    // For authenticated requests, also include user ID if available
    const userId = request.user?.id;

    // For some endpoints, use email from request body
    const email = request.body?.email;

    if (userId) {
      return `user:${userId}:${ip}`;
    } else if (email) {
      return `email:${email}:${ip}`;
    } else {
      return `ip:${ip}`;
    }
  }

  private getClientIp(request: AuthenticatedRequest): string {
    return (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      '0.0.0.0'
    );
  }

  private cleanupOldEntries(cutoff: number): void {
    for (const [key, entry] of Object.entries(this.store)) {
      if (entry.resetTime <= cutoff) {
        delete this.store[key];
      }
    }
  }

  // Method to manually reset rate limit for a key (useful for admin operations)
  resetRateLimit(key: string): void {
    delete this.store[key];
    this.logger.log(`Rate limit reset for key: ${key}`);
  }

  // Method to get current rate limit status for a key
  getRateLimitStatus(key: string): {
    count: number;
    remaining: number;
    resetTime: number;
    blocked: boolean;
  } | null {
    const entry = this.store[key];
    if (!entry) return null;

    const config = this.configs.default; // Default config for status check
    return {
      count: entry.count,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      blocked: entry.blocked,
    };
  }
}
