import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../enums/role.enum.js';

export class ProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: Role })
  role!: Role;
}
