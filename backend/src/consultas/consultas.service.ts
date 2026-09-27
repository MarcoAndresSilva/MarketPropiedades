import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoPublicacion } from '../generated/prisma/enums';
import { CreateConsultaDto } from './dto/create-consulta.dto';

@Injectable()
export class ConsultasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(slug: string, dto: CreateConsultaDto) {
    if (!dto.email && !dto.telefono) {
      throw new BadRequestException(['Deja un correo o un teléfono para que puedan responderte.']);
    }

    const property = await this.prisma.property.findFirst({
      where: { slug, estado: EstadoPublicacion.PUBLICADA },
      select: { id: true },
    });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada.');
    }

    // Honeypot lleno = bot: misma respuesta que una consulta real, sin guardar nada.
    if (dto.sitioWeb) {
      return { ok: true };
    }

    await this.prisma.consulta.create({
      data: {
        propertyId: property.id,
        nombre: dto.nombre.trim(),
        email: dto.email?.trim() || null,
        telefono: dto.telefono?.trim() || null,
        mensaje: dto.mensaje.trim(),
      },
    });
    return { ok: true };
  }

  findAllForAdmin() {
    return this.prisma.consulta.findMany({
      include: { property: { select: { id: true, slug: true, titulo: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async marcarLeida(id: string, leida: boolean) {
    const consulta = await this.prisma.consulta.findUnique({ where: { id } });
    if (!consulta) {
      throw new NotFoundException('Consulta no encontrada.');
    }
    return this.prisma.consulta.update({ where: { id }, data: { leida } });
  }
}
