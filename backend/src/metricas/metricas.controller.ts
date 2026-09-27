import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MetricasService } from './metricas.service';
import { CreateEventoDto } from './dto/create-evento.dto';

@Controller()
export class MetricasController {
  constructor(private readonly metricas: MetricasService) {}

  // Público: lo llama el navegador al ver una ficha, tocar WhatsApp o guardar en
  // favoritos. 204 sin cuerpo: el frontend no espera ni muestra nada de esto.
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('properties/:slug/eventos')
  @HttpCode(204)
  async registrar(@Param('slug') slug: string, @Body() dto: CreateEventoDto) {
    await this.metricas.registrar(slug, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('metricas/propiedades')
  totales() {
    return this.metricas.totalesPorPropiedad();
  }
}
