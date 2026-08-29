import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';
import { JwtPayload } from '../interfaces/jwt-payload.interface.js';
import { RequestWithCookies } from '../interfaces/jwt-refresh.strategy.js';
import { Role } from '../enums/role.enum.js';
import { ACCESS_TOKEN_COOKIE } from '../services/cookie.service.js';
import { DatabaseService } from '../../database/database.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: RequestWithCookies): string | null =>
          request.cookies?.[ACCESS_TOKEN_COOKIE] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub) throw new UnauthorizedException('Token inválido');

    if (!payload.sessionId) throw new UnauthorizedException('Sesión inválida');

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

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.role?.code) {
      throw new UnauthorizedException('El usuario no tiene un rol asignado');
    }

    const role = user.role.code;

    switch (role) {
      case Role.ADMIN:
      case Role.CLIENT:
        break;

      default:
        throw new UnauthorizedException('El usuario tiene un rol inválido');
    }

    return {
      id: user.id,
      role,
      sessionId: payload.sessionId,
    };
  }
}
