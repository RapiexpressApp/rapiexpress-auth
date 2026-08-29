import { SetMetadata } from '@nestjs/common';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Role } from '../enums/role.enum.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';

export const ROLES_KEY = 'roles';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiCookieAuth('cookieAuth'),

    ApiUnauthorizedResponse({
      description: 'No autorizado. Token inválido, expirado o usuario no autenticado.',
    }),

    ApiForbiddenResponse({
      description: 'El usuario no tiene permisos suficientes para acceder a este recurso.',
    }),
  );
}

export function AuthRefresh() {
  return applyDecorators(
    UseGuards(JwtRefreshGuard),
    ApiCookieAuth('cookieAuth'),
    ApiUnauthorizedResponse({
      description: 'No autorizado. Token de actualización inválido o expirado.',
    }),
  );
}
