import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { Role } from '../enums/role.enum.js';
import { ROLES_KEY } from '../decorators/auth.decorator.js';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();

    const user = request.user;

    if (!user) throw new UnauthorizedException('Usuario no autenticado.');

    if (!requiredRoles.includes(user.role))
      throw new UnauthorizedException('No tienes permisos para acceder a este recurso.');

    return true;
  }
}
