import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required roles from method or class metadata
    const requiredRoles =
      this.reflector.get<UserRole[]>('roles', context.getHandler()) ||
      this.reflector.get<UserRole[]>('roles', context.getClass());

    if (!requiredRoles || requiredRoles.length === 0) {
      // No roles specified, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role || !requiredRoles.includes(user.role)) {
        throw new ForbiddenException('Access denied: insufficient role');
      }

    if (!requiredRoles.includes(user.role)) {
      this.logger.warn(
        `Access denied: User role "${user.role}" does not match required roles [${requiredRoles.join(', ')}]`,
      );
      throw new ForbiddenException('Access denied: Insufficient permissions');
    }

    return true;
  }
}
