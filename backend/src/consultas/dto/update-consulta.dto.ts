import { IsBoolean } from 'class-validator';

export class UpdateConsultaDto {
  @IsBoolean()
  leida: boolean;
}
