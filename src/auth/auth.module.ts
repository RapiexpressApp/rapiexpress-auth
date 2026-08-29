import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { CookieService } from './services/cookie.service.js';
import { TokenService } from './services/token.service.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    }),

    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, TokenService, CookieService, JwtStrategy, JwtRefreshStrategy],

  exports: [PassportModule, TokenService, CookieService],
})
export class AuthModule {}
