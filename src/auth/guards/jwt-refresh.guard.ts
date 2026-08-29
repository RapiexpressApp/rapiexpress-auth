import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  mixin,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const PassportJwtRefreshGuard = AuthGuard('jwt-refresh');

@Injectable()
class JwtRefreshGuardMixin extends PassportJwtRefreshGuard implements CanActivate {
  override handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err) {
      throw new UnauthorizedException(
        'El token de actualización es inválido, expiró o no pudo ser verificado.',
      );
    }

    if (!user) {
      throw new UnauthorizedException('La sesión no es válida. Inicie sesión nuevamente.');
    }

    return user;
  }
}

export const JwtRefreshGuard = mixin(JwtRefreshGuardMixin);
