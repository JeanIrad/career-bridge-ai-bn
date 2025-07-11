// import {
//   Injectable,
//   CanActivate,
//   ExecutionContext,
//   UnauthorizedException,
// } from '@nestjs/common';
// // import { ClerkService } from '../clerk.service';

// @Injectable()
// export class AuthGuard implements CanActivate {
//   constructor(private readonly clerkService: ClerkService) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();
//     const token = this.extractTokenFromHeader(request);

//     if (!token) {
//       throw new UnauthorizedException('No token provided');
//     }

//     try {
//       const payload = await this.clerkService.verifyToken(token);
//       const user = await this.clerkService.getUser(payload.sub);

//       // Attach user to request object
//       request.user = user;
//       return true;
//     } catch (error) {
//       throw new UnauthorizedException('Invalid token');
//     }
//   }

//   private extractTokenFromHeader(request: any): string | undefined {
//     const [type, token] = request.headers.authorization?.split(' ') ?? [];
//     return type === 'Bearer' ? token : undefined;
//   }
// }
