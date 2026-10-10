import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LocationsService } from './locations.service';

// Protegido: lo usa el selector de comuna al cargar una propiedad, en el panel del admin
// y en el del anunciante. Nada le impide ser público más adelante si hace falta.
@UseGuards(JwtAuthGuard)
@Controller('comunas')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get()
  findAll() {
    return this.locations.findAll();
  }
}
