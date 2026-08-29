import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { Throttle } from '@nestjs/throttler';

import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service.js';
import { CookieService, REFRESH_TOKEN_COOKIE } from './services/cookie.service.js';
import { Auth, AuthRefresh } from './decorators/auth.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { JwtPayload } from './interfaces/jwt-payload.interface.js';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface.js';
import { LoginAuthDto } from './dto/request/login-auth.dto.js';
import { ResponseHelper } from '../common/response/response.helper.js';
import { RegisterAuthDto } from './dto/request/register-auth.dto.js';

@ApiTags('auth')
@ApiInternalServerErrorResponse({
  description: 'Error interno del servidor.',
})
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary: 'Registra un nuevo usuario.',
  })
  @ApiOkResponse({
    description: 'Usuario registrado correctamente.',
  })
  @ApiTooManyRequestsResponse({
    description: 'Demasiados intentos de registro. Intente de nuevo más tarde.',
  })
  async register(@Body() registerAuthDto: RegisterAuthDto): Promise<ResponseHelper<void>> {
    return this.authService.register(registerAuthDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Inicia sesión y establece las cookies de autenticación.',
  })
  @ApiOkResponse({
    description: 'Inicio de sesión exitoso.',
  })
  @ApiTooManyRequestsResponse({
    description: 'Demasiados intentos de inicio de sesión. Intente de nuevo más tarde.',
  })
  async login(
    @Body() loginAuthDto: LoginAuthDto,
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: ExpressResponse,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(
      loginAuthDto,
      request.socket.remoteAddress ?? undefined,
      request.headers['user-agent'],
    );

    this.cookieService.setAuthCookies(response, accessToken, refreshToken);

    return new ResponseHelper('Inicio de sesión exitoso.');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @AuthRefresh()
  @ApiOperation({
    summary: 'Renueva los tokens de acceso usando el token de actualización.',
  })
  @ApiOkResponse({
    description: 'Token actualizado correctamente.',
  })
  @ApiTooManyRequestsResponse({
    description: 'Demasiadas solicitudes de actualización. Intente de nuevo más tarde.',
  })
  async refresh(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: ExpressResponse,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no proporcionado.');
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refresh(
      user.id,
      user.sessionId!,
      refreshToken,
    );

    this.cookieService.setAuthCookies(response, accessToken, newRefreshToken);

    return new ResponseHelper('Token actualizado correctamente.');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Auth()
  @ApiOperation({
    summary: 'Cierra la sesión actual.',
  })
  @ApiOkResponse({
    description: 'Sesión cerrada correctamente.',
  })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: ExpressResponse,
  ) {
    await this.authService.logout(user.id, user.sessionId!);

    this.cookieService.clearAuthCookies(response);

    return new ResponseHelper('Sesión cerrada correctamente.');
  }

  @Get('profile')
  @Auth()
  @ApiOperation({ summary: 'Obtiene el perfil del usuario autenticado.' })
  @ApiOkResponse({ description: 'Perfil obtenido correctamente.' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id);
  }
}
