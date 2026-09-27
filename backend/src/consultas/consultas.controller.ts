import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsultasService } from './consultas.service';
import { CreateConsultaDto } from './dto/create-consulta.dto';
import { UpdateConsultaDto } from './dto/update-consulta.dto';

@Controller()
export class ConsultasController {
  constructor(private readonly consultas: ConsultasService) {}

  // Público: formulario de la ficha. Límite estricto por IP (5 cada 10 minutos) — nadie
  // manda más consultas que eso de buena fe, y frena el spam sin captcha.
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @Post('properties/:slug/consultas')
  @HttpCode(201)
  create(@Param('slug') slug: string, @Body() dto: CreateConsultaDto) {
    return this.consultas.create(slug, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('consultas')
  findAll() {
    return this.consultas.findAllForAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('consultas/:id')
  marcarLeida(@Param('id') id: string, @Body() dto: UpdateConsultaDto) {
    return this.consultas.marcarLeida(id, dto.leida);
  }
}
