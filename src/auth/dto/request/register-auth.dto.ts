import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAuthDto {
  @ApiProperty({
    example: 'usuario@gmail.com',
    description: 'Correo electrónico del usuario.',
    maxLength: 255,
  })
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
    {
      host_whitelist: ['gmail.com', 'hotmail.com', 'outlook.com'],
    },
    {
      message: 'Solo se permiten correos de Gmail, Hotmail u Outlook.',
    },
  )
  @MaxLength(255, {
    message: 'El correo electrónico no puede superar los 255 caracteres.',
  })
  email: string;

  @ApiProperty({
    example: 'Kevin Andrés Villegas',
    description: 'Nombre completo del usuario.',
    minLength: 3,
    maxLength: 100,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @IsNotEmpty({
    message: 'El nombre completo es obligatorio.',
  })
  @IsString({
    message: 'El nombre completo debe ser una cadena de texto.',
  })
  @MinLength(3, {
    message: 'El nombre completo debe tener al menos 3 caracteres.',
  })
  @MaxLength(100, {
    message: 'El nombre completo no puede superar los 100 caracteres.',
  })
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/, {
    message: 'El nombre completo solo puede contener letras, espacios, apóstrofes y guiones.',
  })
  fullName: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Contraseña con mínimo 8 caracteres, incluyendo mayúscula, minúscula, número y carácter especial.',
    minLength: 8,
    maxLength: 64,
    format: 'password',
  })
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
