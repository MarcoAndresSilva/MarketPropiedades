import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TipoOperacion, TipoPropiedad } from '../../generated/prisma/enums';

// Filtros del catálogo público — siempre sobre propiedades PUBLICADA (ver service).
export class QueryPropertiesDto {
  @IsOptional()
  @IsString()
  comunaId?: string;

  @IsOptional()
  @IsEnum(TipoOperacion)
  tipoOperacion?: TipoOperacion;

  @IsOptional()
  @IsEnum(TipoPropiedad)
  tipoPropiedad?: TipoPropiedad;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  dormitoriosMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 20;
}
