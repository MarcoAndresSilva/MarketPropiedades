import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { SoloAnunciante } from '../auth/roles';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { MisPropiedadesService } from './mis-propiedades.service';
import { CreatePropiedadAnuncianteDto, UpdatePropiedadAnuncianteDto } from './dto/propiedad-anunciante.dto';
import { CambiarEstadoDto } from './dto/moderacion.dto';
import { CreatePropertyFotoDto } from './dto/create-property-foto.dto';

// Panel del anunciante. Controller aparte del de /properties porque cambian el guard, los
// DTO (sin publicador, estado ni destacada) y el alcance: todo sobre la cuenta propia.
@SoloAnunciante()
@Controller('mis-propiedades')
export class MisPropiedadesController {
  constructor(private readonly misPropiedades: MisPropiedadesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.misPropiedades.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.misPropiedades.findOne(id, user.id);
  }

  @Post()
  create(@Body() dto: CreatePropiedadAnuncianteDto, @CurrentUser() user: AuthUser) {
    return this.misPropiedades.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePropiedadAnuncianteDto, @CurrentUser() user: AuthUser) {
    return this.misPropiedades.update(id, dto, user.id);
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoDto, @CurrentUser() user: AuthUser) {
    return this.misPropiedades.cambiarEstado(id, dto.estado, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.misPropiedades.remove(id, user.id);
  }

  @Post(':id/fotos')
  addFoto(@Param('id') id: string, @Body() dto: CreatePropertyFotoDto, @CurrentUser() user: AuthUser) {
    return this.misPropiedades.addFoto(id, dto, user.id);
  }

  @Delete('fotos/:fotoId')
  removeFoto(@Param('fotoId') fotoId: string, @CurrentUser() user: AuthUser) {
    return this.misPropiedades.removeFoto(fotoId, user.id);
  }
}
