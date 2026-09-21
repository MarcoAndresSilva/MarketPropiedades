import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Las 346 comunas del país (§1: el modelo es nacional a propósito), no solo las que
  // ya tienen propiedades - el admin tiene que poder cargar una propiedad en cualquier
  // comuna, incluida la primera en una zona nueva. Distinto de
  // GET /properties/comunas (público, solo comunas con propiedades PUBLICADA).
  findAll() {
    return this.prisma.comuna.findMany({
      include: { region: true },
      orderBy: [{ region: { nombre: 'asc' } }, { nombre: 'asc' }],
    });
  }
}
