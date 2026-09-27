import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateConsultaDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre: string;

  // Correo o teléfono: al menos uno (se valida en el service, porque depende de ambos).
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @Matches(/^\+?[\d\s-]{8,20}$/, { message: 'telefono debe tener entre 8 y 20 dígitos' })
  telefono?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  mensaje: string;

  // Honeypot: un campo oculto en el formulario que una persona nunca llena. Si viene con
  // algo, es un bot — se responde como si nada para no darle pistas, pero no se guarda.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sitioWeb?: string;
}
