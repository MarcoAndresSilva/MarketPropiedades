import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoPublicacion, Role } from '../generated/prisma/enums';
import { CreatePropertyFotoDto } from '../properties/dto/create-property-foto.dto';
import { randomSlugSuffix, slugify } from '../properties/slug.util';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { QueryProyectosDto } from './dto/query-proyectos.dto';

const INCLUDE = {
  comuna: { include: { region: true } },
  fotos: { orderBy: { orden: 'asc' as const } },
  publicador: { select: { id: true, name: true, whatsapp: true, role: true } },
};

// Solo corredoras e inmobiliarias desarrollan proyectos; un propietario particular no.
const ROLES_DESARROLLADOR: Role[] = [Role.CORREDORA, Role.INMOBILIARIA];

// Admite null porque en un PATCH se combinan con los valores ya guardados en la base.
type Rangos = Partial<Record<'dormitoriosMin' | 'dormitoriosMax' | 'banosMin' | 'banosMax' | 'm2Min' | 'm2Max', number | null>>;

/** Mensajes de error para rangos invertidos ("desde 3 hasta 1 dormitorio"). */
export function erroresDeRango(r: Rangos): string[] {
  const pares: [keyof Rangos, keyof Rangos, string][] = [
    ['dormitoriosMin', 'dormitoriosMax', 'dormitorios'],
    ['banosMin', 'banosMax', 'baños'],
    ['m2Min', 'm2Max', 'm²'],
  ];
  return pares
    .filter(([min, max]) => r[min] != null && r[max] != null && (r[min] as number) > (r[max] as number))
    .map(([, , nombre]) => `El mínimo de ${nombre} no puede ser mayor que el máximo.`);
}

@Injectable()
export class ProyectosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProyectoDto) {
    this.validarRangos(dto);
    await this.validarPublicador(dto.publicadorId);
    // Mismo criterio que las propiedades: el slug se genera una vez y no cambia nunca.
    const slug = `proyecto-${slugify(dto.nombre)}-${randomSlugSuffix()}`;
    return this.prisma.proyecto.create({ data: { ...dto, slug }, include: INCLUDE });
  }

  async findPublished(query: QueryProyectosDto) {
    const where = {
      estado: EstadoPublicacion.PUBLICADA,
      comunaId: query.comunaId,
      etapa: query.etapa,
      destacado: query.destacado || undefined,
    };
    const [items, total] = await Promise.all([
      this.prisma.proyecto.findMany({
        where,
        include: INCLUDE,
        orderBy: [{ destacado: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.proyecto.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findPublishedBySlug(slug: string) {
    const proyecto = await this.prisma.proyecto.findFirst({
      where: { slug, estado: EstadoPublicacion.PUBLICADA },
      include: INCLUDE,
    });
    if (!proyecto) {
      throw new NotFoundException('Proyecto no encontrado.');
    }
    return proyecto;
  }

  findAllForAdmin() {
    return this.prisma.proyecto.findMany({ include: INCLUDE, orderBy: { createdAt: 'desc' } });
  }

  async findOneForAdmin(id: string) {
    const proyecto = await this.prisma.proyecto.findUnique({ where: { id }, include: INCLUDE });
    if (!proyecto) {
      throw new NotFoundException('Proyecto no encontrado.');
    }
    return proyecto;
  }

  async update(id: string, dto: UpdateProyectoDto) {
    const actual = await this.findOneForAdmin(id);
    // Los rangos se validan contra el resultado final: un PATCH puede traer solo un extremo.
    this.validarRangos({ ...actual, ...dto });
    if (dto.publicadorId) {
      await this.validarPublicador(dto.publicadorId);
    }
    return this.prisma.proyecto.update({ where: { id }, data: dto, include: INCLUDE });
  }

  async remove(id: string) {
    await this.findOneForAdmin(id);
    await this.prisma.proyecto.delete({ where: { id } });
    return { ok: true };
  }

  async addFoto(proyectoId: string, dto: CreatePropertyFotoDto) {
    await this.findOneForAdmin(proyectoId);
    return this.prisma.proyectoFoto.create({
      data: { proyectoId, cloudinaryPublicId: dto.cloudinaryPublicId, orden: dto.orden },
    });
  }

  async removeFoto(fotoId: string) {
    const foto = await this.prisma.proyectoFoto.findUnique({ where: { id: fotoId } });
    if (!foto) {
      throw new NotFoundException('Foto no encontrada.');
    }
    await this.prisma.proyectoFoto.delete({ where: { id: fotoId } });
    return { ok: true };
  }

  private validarRangos(r: Rangos) {
    const errores = erroresDeRango(r);
    if (errores.length > 0) {
      throw new BadRequestException(errores);
    }
  }

  private async validarPublicador(publicadorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: publicadorId }, select: { role: true } });
    if (!user || !ROLES_DESARROLLADOR.includes(user.role)) {
      throw new BadRequestException(['El proyecto debe pertenecer a una corredora o inmobiliaria.']);
    }
  }
}
