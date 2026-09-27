import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePropertyFotoDto } from '../properties/dto/create-property-foto.dto';
import { ProyectosService } from './proyectos.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { QueryProyectosDto } from './dto/query-proyectos.dto';

// Mismo esquema que PropertiesController: público solo lo PUBLICADO, el resto detrás de
// JwtAuthGuard, y las rutas fijas declaradas antes que las de un parámetro.
@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly proyectos: ProyectosService) {}

  @Get()
  findPublished(@Query() query: QueryProyectosDto) {
    return this.proyectos.findPublished(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAllForAdmin() {
    return this.proyectos.findAllForAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/:id')
  findOneForAdmin(@Param('id') id: string) {
    return this.proyectos.findOneForAdmin(id);
  }

  @Get(':slug')
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.proyectos.findPublishedBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateProyectoDto) {
    return this.proyectos.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProyectoDto) {
    return this.proyectos.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.proyectos.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/fotos')
  addFoto(@Param('id') id: string, @Body() dto: CreatePropertyFotoDto) {
    return this.proyectos.addFoto(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('fotos/:fotoId')
  removeFoto(@Param('fotoId') fotoId: string) {
    return this.proyectos.removeFoto(fotoId);
  }
}
