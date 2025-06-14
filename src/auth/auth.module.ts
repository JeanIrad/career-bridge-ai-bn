import { Module } from '@nestjs/common';
// import { ClerkService } from './clerk.service';
import { AuthController } from './auth.controller';
// import { AuthGuard } from './guards/auth.guard';
// import { SessionGuard } from './guards/session.guard';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    /* lerkService , AuthGuard,  */ /* SessionGuard */ AuthService,
    JwtStrategy,
  ],
  exports: [
    /* ClerkService, */
    /* AuthGuard, SessionGuard*/
    /*  */
  ],
})
export class AuthModule {}
