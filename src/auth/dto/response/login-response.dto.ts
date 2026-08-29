import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../enums/role.enum.js';

export class LoginUserResponseDto {
  @ApiProperty({
    description: 'Identificador del usuario.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario.',
    example: 'usuario@gmail.com',
  })
  email!: string;

  @ApiProperty({
    enum: Role,
    description: 'Rol del usuario autenticado.',
    example: Role.CLIENT,
  })
  role!: Role;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Token de acceso.',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'Token para renovar el acceso.',
  })
  refreshToken!: string;

  @ApiProperty({
    type: LoginUserResponseDto,
    description: 'Información básica del usuario autenticado.',
  })
  user!: LoginUserResponseDto;
}
