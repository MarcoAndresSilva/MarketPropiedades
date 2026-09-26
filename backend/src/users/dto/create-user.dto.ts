import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '../../generated/prisma/enums';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  // Formato E.164, ej. "+56912345678" — es el número que arma el link wa.me de sus fichas.
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/)
  whatsapp?: string;

  // Se crea siempre como publicador (persona, corredora o inmobiliaria) — ADMIN solo por seed.
  @IsIn([Role.PERSONA, Role.CORREDORA, Role.INMOBILIARIA])
  role: typeof Role.PERSONA | typeof Role.CORREDORA | typeof Role.INMOBILIARIA;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  razonSocial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  rut?: string;
}
