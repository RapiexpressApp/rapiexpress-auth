import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  mixin,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const PassportJwtAuthGuard = AuthGuard('jwt');

@Injectable()
class JwtAuthGuardMixin extends PassportJwtAuthGuard implements CanActivate {
  override handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err) {
      throw new UnauthorizedException('Error al validar las credenciales de autenticación.');
    }

    if (!user) {
      throw new UnauthorizedException('El usuario no está autenticado o el token no es válido.');
    }

    return user;
  }
}

export const JwtAuthGuard = mixin(JwtAuthGuardMixin);
