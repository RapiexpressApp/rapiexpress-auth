import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginAuthDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsNotEmpty({
    message: 'El correo electrónico es obligatorio.',
  })
  @IsString({
    message: 'El correo electrónico debe ser una cadena de texto.',
  })
  @IsEmail(
    { host_whitelist: ['gmail.com', 'hotmail.com', 'outlook.com'] },
    {
      message: 'Solo se permiten correos de Gmail, Hotmail u Outlook.',
    },
  )
  @MaxLength(255, {
    message: 'El correo electrónico no puede superar los 255 caracteres.',
  })
  email?: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({
    message: 'La contraseña es obligatoria.',
  })
  @IsString({
    message: 'La contraseña debe ser una cadena de texto.',
  })
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 caracteres.',
  })
  @MaxLength(64, {
    message: 'La contraseña no puede superar los 64 caracteres.',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]+$/, {
    message:
      'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial.',
  })
  password: string;
}
