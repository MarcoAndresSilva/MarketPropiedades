import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
import { CreatePropertyFotoDto } from './dto/create-property-foto.dto';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  // --- Catálogo público: solo propiedades PUBLICADA ---

  @Get()
  findPublished(@Query() query: QueryPropertiesDto) {
    return this.properties.findPublished(query);
  }

  @Get(':slug')
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.properties.findPublishedBySlug(slug);
  }

  // --- Panel de administración: cualquier estado ---

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAllForAdmin() {
    return this.properties.findAllForAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreatePropertyDto) {
    return this.properties.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.properties.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.properties.remove(id);
  }

  // --- Fotos: se suben directo a Cloudinary (ver UploadsController), acá solo se
  // registra el resultado (cloudinaryPublicId) contra la propiedad. ---

  @UseGuards(JwtAuthGuard)
  @Post(':id/fotos')
  addFoto(@Param('id') id: string, @Body() dto: CreatePropertyFotoDto) {
    return this.properties.addFoto(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('fotos/:fotoId')
  removeFoto(@Param('fotoId') fotoId: string) {
    return this.properties.removeFoto(fotoId);
  }
}
