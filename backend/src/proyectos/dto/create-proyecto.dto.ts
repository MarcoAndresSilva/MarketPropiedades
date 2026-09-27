import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EstadoPublicacion, EtapaProyecto } from '../../generated/prisma/enums';

export class CreateProyectoDto {
  // Cuenta de corredora o inmobiliaria que lo desarrolla (se valida el rol en el service).
  @IsString()
  @IsNotEmpty()
  publicadorId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre: string;

  @IsEnum(EtapaProyecto)
  etapa: EtapaProyecto;

  // Texto libre porque así se comunica en el rubro: "2º semestre 2027", "Marzo 2028".
  @IsOptional()
  @IsString()
  @MaxLength(60)
  entrega?: string;

  @IsOptional()
  @IsEnum(EstadoPublicacion)
  estado?: EstadoPublicacion;

  @IsOptional()
  @IsBoolean()
  destacado?: boolean;

  @IsString()
  @IsNotEmpty()
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

  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  descripcion: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioDesdeUf?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  dormitoriosMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  dormitoriosMax?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  banosMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  banosMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  m2Min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  m2Max?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  unidades?: number;
}
