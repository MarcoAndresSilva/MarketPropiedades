import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
import { CreatePropertyFotoDto } from './dto/create-property-foto.dto';
import { EstadoPublicacion, TipoOperacion } from '../generated/prisma/enums';
import { randomSlugSuffix, slugify } from './slug.util';
import { IndicadoresService } from '../indicadores/indicadores.service';

const LIST_INCLUDE = {
  comuna: { include: { region: true } },
  fotos: { orderBy: { orden: 'asc' as const } },
  publicador: { select: { id: true, name: true, whatsapp: true, role: true } },
};

// Venta se guarda en UF y arriendo en CLP (convención chilena del schema), así que el rango
// de precio va contra una columna u otra según la operación. Sin operación el filtro se
// ignora en vez de adivinar la unidad.
export function precioWhere(query: Pick<QueryPropertiesDto, 'tipoOperacion' | 'precioMin' | 'precioMax'>) {
  if (!query.tipoOperacion || (query.precioMin === undefined && query.precioMax === undefined)) {
    return {};
  }
  const rango = { gte: query.precioMin, lte: query.precioMax };
  // Venta: contra la referencia en UF, que incluye las ventas publicadas en pesos.
  return query.tipoOperacion === TipoOperacion.VENTA ? { precioRefUf: rango } : { precioClp: rango };
}

// Por precio solo con operación (la columna depende de ella, igual que en precioWhere);
// sin operación, o en "recientes", las destacadas van primero y después lo más nuevo.
// `createdAt` al final desempata para que la paginación sea estable.
export function ordenBy(query: Pick<QueryPropertiesDto, 'tipoOperacion' | 'orden'>) {
  if (query.tipoOperacion && query.orden !== 'recientes') {
    const direccion = query.orden === 'precio_asc' ? ('asc' as const) : ('desc' as const);
    const columna = query.tipoOperacion === TipoOperacion.VENTA ? 'precioRefUf' : 'precioClp';
    return [{ [columna]: { sort: direccion, nulls: 'last' as const } }, { createdAt: 'desc' as const }];
  }
  return [{ destacada: 'desc' as const }, { createdAt: 'desc' as const }];
}

type Precios = { tipoOperacion?: TipoOperacion | null; precioUf?: number | { toString(): string } | null; precioClp?: number | null };

/**
 * Referencia en UF de una venta: su precioUf si lo tiene, o su precio en pesos dividido
 * por la UF del día. Arriendos y ventas sin precio no tienen referencia.
 */
export function precioRefUf(p: Precios, valorUf: number): number | null {
  if (p.tipoOperacion !== TipoOperacion.VENTA) return null;
  if (p.precioUf !== null && p.precioUf !== undefined) return Number(p.precioUf);
  if (p.precioClp !== null && p.precioClp !== undefined) return Math.round((p.precioClp / valorUf) * 100) / 100;
  return null;
}

/**
 * Una propiedad se publica en una sola moneda: una venta en UF o en pesos (no las dos, o
 * el sitio no sabría cuál mostrar como precio publicado) y un arriendo siempre en pesos.
 * Devuelve los mensajes de error para responder un 400 legible.
 */
export function erroresDePrecio(p: Precios): string[] {
  const tieneUf = p.precioUf !== null && p.precioUf !== undefined;
  const tieneClp = p.precioClp !== null && p.precioClp !== undefined;
  if (p.tipoOperacion === TipoOperacion.VENTA && tieneUf && tieneClp) {
    return ['Una venta se publica en UF o en pesos, no en las dos monedas a la vez.'];
  }
  if (p.tipoOperacion === TipoOperacion.ARRIENDO && tieneUf) {
    return ['Un arriendo se publica en pesos (precioClp), no en UF.'];
  }
  return [];
}

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly indicadores: IndicadoresService,
  ) {}

  async create(dto: CreatePropertyDto) {
    const comuna = await this.prisma.comuna.findUniqueOrThrow({ where: { id: dto.comunaId } });
    const slug = `${slugify(dto.tipoPropiedad)}-${slugify(comuna.nombre)}-${randomSlugSuffix()}`;

    this.validarPrecio(dto);
    const { valor } = await this.indicadores.uf();
    return this.prisma.property.create({
      data: { ...dto, slug, precioRefUf: precioRefUf(dto, valor) },
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
      ...precioWhere(query),
    };

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: ordenBy(query),
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
    const actual = await this.findOneOrThrow(id);
    // Un PATCH puede traer solo el precio o solo la operación: la referencia se calcula
    // sobre el resultado final, no sobre lo que vino en la request.
    this.validarPrecio({ ...actual, ...dto });
    const { valor } = await this.indicadores.uf();
    const data = { ...dto, precioRefUf: precioRefUf({ ...actual, ...dto }, valor) };
    return this.prisma.property.update({ where: { id }, data, include: LIST_INCLUDE });
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

  private validarPrecio(p: Precios) {
    const errores = erroresDePrecio(p);
    if (errores.length > 0) {
      throw new BadRequestException(errores);
    }
  }

  private async findOneOrThrow(id: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada.');
    }
    return property;
  }
}
