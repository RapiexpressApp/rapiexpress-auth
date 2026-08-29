import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutos
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días

@Injectable()
export class CookieService {
  constructor(private readonly configService: ConfigService) {}

  setAuthCookies(response: Response, accessToken: string, refreshToken: string): void {
    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, this.buildOptions(ACCESS_TOKEN_MAX_AGE));

    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, this.buildOptions(REFRESH_TOKEN_MAX_AGE));
  }

  clearAuthCookies(response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, this.buildOptions(0));

    response.clearCookie(REFRESH_TOKEN_COOKIE, this.buildOptions(0));
  }

  private buildOptions(maxAge: number): CookieOptions {
    const isProduction = this.configService.getOrThrow<string>('NODE_ENV') === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge,
    };
  }
}
