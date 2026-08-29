import { ProfileResponseDto } from '../dto/response/profile-response.dto.js';
import { user } from '../../generated/prisma/client.js';
import { Role } from '../enums/role.enum.js';

export class ProfileMappers {
  static toResponse(user: user): ProfileResponseDto {
    return {
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.user_type as unknown as Role,
    };
  }

  static toResponseList(users: user[]): ProfileResponseDto[] {
    return users.map((user) => this.toResponse(user));
  }
}
