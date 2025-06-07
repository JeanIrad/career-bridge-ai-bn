import { Module } from '@nestjs/common';
// import { ClerkService } from './clerk.service';
import { AuthController } from './auth.controller';
// import { AuthGuard } from './guards/auth.guard';
// import { SessionGuard } from './guards/session.guard';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [/* lerkService , AuthGuard,  */ /* SessionGuard */ AuthService],
  exports: [/* ClerkService, */ /* AuthGuard, SessionGuard*/ /*  */],
})
export class AuthModule {}
