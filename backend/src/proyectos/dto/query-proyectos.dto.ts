import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { EtapaProyecto } from '../../generated/prisma/enums';

export class QueryProyectosDto {
  @IsOptional()
  @IsString()
  comunaId?: string;

  @IsOptional()
  @IsEnum(EtapaProyecto)
  etapa?: EtapaProyecto;

  // "true" en la query string: la home pide solo los destacados.
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  destacado?: boolean;

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
