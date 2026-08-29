import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from '../interfaces/jwt-payload.interface.js';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(userId: string, role: string, sessionId: string): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      role,
      sessionId,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow<number>('JWT_EXPIRES_IN'),
    });
  }

  async generateRefreshToken(userId: string, sessionId: string): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      sessionId,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.getOrThrow<number>('REFRESH_TOKEN_EXPIRES_IN'),
    });
  }
}
