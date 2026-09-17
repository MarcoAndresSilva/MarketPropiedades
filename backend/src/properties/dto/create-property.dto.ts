import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EstadoPublicacion, TipoOperacion, TipoPropiedad } from '../../generated/prisma/enums';

export class CreatePropertyDto {
  @IsString()
  publicadorId: string;

  @IsEnum(TipoOperacion)
  tipoOperacion: TipoOperacion;

  @IsEnum(TipoPropiedad)
  tipoPropiedad: TipoPropiedad;

  @IsOptional()
  @IsEnum(EstadoPublicacion)
  estado?: EstadoPublicacion;

  @IsOptional()
  @IsBoolean()
  destacada?: boolean;

  @IsString()
  comunaId: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  // Venta en UF.
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioUf?: number;

  // Arriendo en CLP.
  @IsOptional()
  @IsInt()
  @Min(0)
  precioClp?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  m2Construidos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  m2Terreno?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  dormitorios?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  banos?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estacionamientos?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bodegas?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  gastosComunesClp?: number;

  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  descripcion: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;
}
