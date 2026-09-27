import { IsEnum, IsString, Matches } from 'class-validator';
import { TipoEvento } from '../../generated/prisma/enums';

export class CreateEventoDto {
  @IsEnum(TipoEvento)
  tipo: TipoEvento;

  // Id anónimo que genera el navegador (UUID o similar), solo para deduplicar.
  @IsString()
  @Matches(/^[a-zA-Z0-9-]{8,64}$/)
  visitante: string;
}
