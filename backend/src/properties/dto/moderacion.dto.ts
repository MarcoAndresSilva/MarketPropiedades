import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { EstadoPublicacion } from '../../generated/prisma/enums';

export class QueryAdminPropertiesDto {
  // Filtra el listado del panel, ej. ?estado=EN_REVISION para la cola de moderación.
  @IsOptional()
  @IsEnum(EstadoPublicacion)
  estado?: EstadoPublicacion;
}

export class RechazarPropertyDto {
  // Le llega al anunciante por correo y en su panel: tiene que decirle qué corregir.
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  motivo: string;
}

export class CambiarEstadoDto {
  @IsEnum(EstadoPublicacion)
  estado: EstadoPublicacion;
}
