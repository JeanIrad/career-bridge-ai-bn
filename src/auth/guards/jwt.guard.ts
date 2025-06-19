import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First run the default JWT validation
    const canActivate = await super.canActivate(context);

    if (!canActivate) {
      return false;
    }

    // Get the user from the request (set by JWT strategy)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Additional validation for account status
    const canAccess = await this.authService.canUserAccess(user.id);

    if (!canAccess) {
      throw new ForbiddenException({
        message:
          'Account access is restricted. Account may be unverified, inactive, or suspended.',
        code: 'ACCOUNT_ACCESS_DENIED',
        action: 'Please verify your account or contact support.',
      });
    }

    return true;
  }
}
