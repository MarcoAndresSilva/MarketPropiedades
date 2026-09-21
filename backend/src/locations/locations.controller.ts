import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LocationsService } from './locations.service';

// Protegido: hoy el único consumidor es el selector de comuna del panel de admin al
// cargar una propiedad. Nada le impide ser público más adelante si hace falta.
@UseGuards(JwtAuthGuard)
@Controller('comunas')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get()
  findAll() {
    return this.locations.findAll();
  }
}
