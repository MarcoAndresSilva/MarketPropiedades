import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
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

  // Rango de precio en la unidad de la operación: UF para VENTA, CLP para ARRIENDO.
  // Sin tipoOperacion se ignora (ver service): el número no significa nada sin su unidad.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMax?: number;

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
