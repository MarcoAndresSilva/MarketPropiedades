import { Controller, Get } from '@nestjs/common';
import { IndicadoresService } from './indicadores.service';

@Controller('indicadores')
export class IndicadoresController {
  constructor(private readonly indicadores: IndicadoresService) {}

  // Público: el frontend lo usa para mostrar el precio equivalente (UF ↔ pesos).
  @Get('uf')
  uf() {
    return this.indicadores.uf();
  }
}
