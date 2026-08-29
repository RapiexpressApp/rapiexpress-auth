import { Transform } from 'class-transformer';
import { IsJWT, IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({
    message: 'El token de actualización es obligatorio.',
  })
  @IsString({
    message: 'El token de actualización debe ser una cadena de texto.',
  })
  @IsJWT({
    message: 'El token de actualización no es válido.',
  })
  refreshToken?: string;
}
