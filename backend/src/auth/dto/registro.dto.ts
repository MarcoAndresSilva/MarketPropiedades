import { OmitType } from '@nestjs/mapped-types';
import { Matches } from 'class-validator';
import { CreateUserDto } from '../../users/dto/create-user.dto';

// Mismos campos que la cuenta que crea el admin, pero el WhatsApp es obligatorio: es el
// contacto que muestran las fichas del anunciante, la diferencia de Habbi con los portales
// que esconden el teléfono.
export class RegistroDto extends OmitType(CreateUserDto, ['whatsapp'] as const) {
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'El WhatsApp debe ir con código de país, ej. +56912345678.' })
  whatsapp: string;
}
