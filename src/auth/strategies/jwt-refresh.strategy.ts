import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Role } from '../enums/role.enum.js';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';
import { JwtPayload } from '../interfaces/jwt-payload.interface.js';
import { RequestWithCookies } from '../interfaces/jwt-refresh.strategy.js';
import { REFRESH_TOKEN_COOKIE } from '../services/cookie.service.js';
import { DatabaseService } from '../../database/database.service.js';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: RequestWithCookies): string | null =>
          request.cookies?.[REFRESH_TOKEN_COOKIE] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub) throw new UnauthorizedException('Token de actualización inválido');

    if (!payload.sessionId) throw new UnauthorizedException('Sesión de actualización inválida');

    const user = await this.databaseService.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
        role: {
          select: {
            code: true,
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    if (!user.role?.code) throw new UnauthorizedException('El usuario no tiene un rol asignado');

    const role = user.role.code as Role;

    return {
      id: user.id,
      role,
      sessionId: payload.sessionId,
    };
  }
}
