// import {
//   Injectable,
//   CanActivate,
//   ExecutionContext,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { ClerkService } from '../clerk.service';

// @Injectable()
// export class SessionGuard implements CanActivate {
//   constructor(private readonly clerkService: ClerkService) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();
//     const sessionId =
//       this.extractSessionFromHeader(request) ||
//       this.extractSessionFromCookie(request);

//     if (!sessionId) {
//       throw new UnauthorizedException('No session provided');
//     }

//     try {
//       const user = await this.clerkService.getUserFromSession(sessionId);

//       // Attach user and session to request object
//       request.user = user;
//       request.sessionId = sessionId;
//       return true;
//     } catch (error) {
//       throw new UnauthorizedException('Invalid session');
//     }
//   }

//   private extractSessionFromHeader(request: any): string | undefined {
//     return request.headers['x-session-id'];
//   }

//   private extractSessionFromCookie(request: any): string | undefined {
//     return request.cookies?.sessionId;
//   }
// }
