// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { ClerkService } from '../clerk.service';

// @Injectable()
// export class ClerkAuthGuard implements CanActivate {
//   constructor(private readonly clerkService: ClerkService) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const req = context.switchToHttp().getRequest();
//     const authHeader = req.headers['authorization'];

//     if (!authHeader) throw new UnauthorizedException('No token provided');

//     // eslint-disable-next-line @typescript-eslint/no-unsafe-call
//     const token = authHeader.split(' ')[1];
//     try {
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//       const payload = await this.clerkService.verifyToken(token);
//       req.user = payload;
//       return true;
//     } catch {
//       throw new UnauthorizedException('Invalid token');
//     }
//   }
// }
