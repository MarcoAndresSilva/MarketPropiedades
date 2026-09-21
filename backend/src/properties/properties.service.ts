import { NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
import { CreatePropertyFotoDto } from './dto/create-property-foto.dto';
import { EstadoPublicacion } from '../generated/prisma/enums';
import { randomSlugSuffix, slugify } from './slug.util';

const LIST_INCLUDE = {
  comuna: { include: { region: true } },
  fotos: { orderBy: { orden: 'asc' as const } },
  publicador: { select: { id: true, name: true, whatsapp: true, role: true } },
};

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePropertyDto) {
    const comuna = await this.prisma.comuna.findUniqueOrThrow({ where: { id: dto.comunaId } });
    const slug = `${slugify(dto.tipoPropiedad)}-${slugify(comuna.nombre)}-${randomSlugSuffix()}`;

    return this.prisma.property.create({
      data: { ...dto, slug },
      include: LIST_INCLUDE,
    });
  }

  async findPublished(query: QueryPropertiesDto) {
    const where = {
      estado: EstadoPublicacion.PUBLICADA,
      comunaId: query.comunaId,
      tipoOperacion: query.tipoOperacion,
      tipoPropiedad: query.tipoPropiedad,
      dormitorios: query.dormitoriosMin ? { gte: query.dormitoriosMin } : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: [{ destacada: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.property.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  // Solo comunas con al menos una propiedad publicada — un dropdown con las 346 comunas del
  // país cuando el catálogo tiene propiedades solo en un puñado de ellas confundiría más de lo
  // que ayuda.
  findComunasConPropiedades() {
    return this.prisma.comuna.findMany({
      where: { properties: { some: { estado: EstadoPublicacion.PUBLICADA } } },
      select: { id: true, nombre: true, regionId: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findPublishedBySlug(slug: string) {
    const property = await this.prisma.property.findFirst({
      where: { slug, estado: EstadoPublicacion.PUBLICADA },
      include: LIST_INCLUDE,
    });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada.');
    }
    return property;
  }

  findAllForAdmin() {
    return this.prisma.property.findMany({
      include: LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForAdmin(id: string) {
    const property = await this.prisma.property.findUnique({ where: { id }, include: LIST_INCLUDE });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada.');
    }
    return property;
  }

  async update(id: string, dto: UpdatePropertyDto) {
    await this.findOneOrThrow(id);
    return this.prisma.property.update({ where: { id }, data: dto, include: LIST_INCLUDE });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.prisma.property.delete({ where: { id } });
    return { ok: true };
  }

  async addFoto(propertyId: string, dto: CreatePropertyFotoDto) {
    await this.findOneOrThrow(propertyId);
    return this.prisma.propertyFoto.create({
      data: { propertyId, cloudinaryPublicId: dto.cloudinaryPublicId, orden: dto.orden },
    });
  }

  async removeFoto(fotoId: string) {
    const foto = await this.prisma.propertyFoto.findUnique({ where: { id: fotoId } });
    if (!foto) {
      throw new NotFoundException('Foto no encontrada.');
    }
    await this.prisma.propertyFoto.delete({ where: { id: fotoId } });
    return { ok: true };
  }

  private async findOneOrThrow(id: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada.');
    }
    return property;
  }
}
