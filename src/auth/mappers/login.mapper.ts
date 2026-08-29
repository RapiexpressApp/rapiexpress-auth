import { Role } from '../enums/role.enum.js';
import { Prisma } from '../../generated/prisma/client.js';

import { LoginResponseDto, LoginUserResponseDto } from '../dto/response/login-response.dto.js';

type LoginUser = Prisma.userGetPayload<{
  include: {
    role: true;
  };
}>;

export class LoginMappers {
  static toUserResponse(user: LoginUser): LoginUserResponseDto {
    if (!user.role) {
      throw new Error('El usuario no tiene un rol asignado.');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role.code as Role,
    };
  }

  static toResponse(accessToken: string, refreshToken: string, user: LoginUser): LoginResponseDto {
    return {
      accessToken,
      refreshToken,
      user: this.toUserResponse(user),
    };
  }
}
