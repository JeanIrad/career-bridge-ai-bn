import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class EmployerDataGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super admins and admins can access any employer data
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return true;
    }

    // Employers can only access their own data
    if (user.role === UserRole.EMPLOYER) {
      // The analytics endpoints will use the authenticated user's ID automatically
      // so this guard just ensures they are an employer
      return true;
    }

    throw new ForbiddenException(
      'Access denied: Insufficient permissions for employer data',
    );
  }
}
