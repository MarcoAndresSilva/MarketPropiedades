import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoPublicacion, TipoEvento } from '../generated/prisma/enums';
import { CreateEventoDto } from './dto/create-evento.dto';

const UN_DIA_MS = 24 * 60 * 60 * 1000;

export interface MetricasPropiedad {
  propertyId: string;
  vistas: number;
  clicsWhatsapp: number;
  favoritos: number;
  consultas: number;
}

@Injectable()
export class MetricasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un evento de una ficha publicada. Cada visitante cuenta una vez por tipo y
   * propiedad cada 24 horas: recargar la ficha o tocar WhatsApp varias veces no infla
   * los números que después ve el anunciante.
   */
  async registrar(slug: string, dto: CreateEventoDto): Promise<void> {
    const property = await this.prisma.property.findFirst({
      where: { slug, estado: EstadoPublicacion.PUBLICADA },
      select: { id: true },
    });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada.');
    }

    const reciente = await this.prisma.eventoPropiedad.findFirst({
      where: {
        propertyId: property.id,
        tipo: dto.tipo,
        visitante: dto.visitante,
        createdAt: { gte: new Date(Date.now() - UN_DIA_MS) },
      },
      select: { id: true },
    });
    if (reciente) return;

    await this.prisma.eventoPropiedad.create({
      data: { propertyId: property.id, tipo: dto.tipo, visitante: dto.visitante },
    });
  }

  /** Totales por propiedad, para el panel. Las consultas salen de su propia tabla. */
  async totalesPorPropiedad(): Promise<MetricasPropiedad[]> {
    const [eventos, consultas] = await Promise.all([
      this.prisma.eventoPropiedad.groupBy({ by: ['propertyId', 'tipo'], _count: { _all: true } }),
      this.prisma.consulta.groupBy({ by: ['propertyId'], _count: { _all: true } }),
    ]);

    const porPropiedad = new Map<string, MetricasPropiedad>();
    const fila = (propertyId: string) => {
      let m = porPropiedad.get(propertyId);
      if (!m) {
        m = { propertyId, vistas: 0, clicsWhatsapp: 0, favoritos: 0, consultas: 0 };
        porPropiedad.set(propertyId, m);
      }
      return m;
    };

    for (const e of eventos) {
      const m = fila(e.propertyId);
      if (e.tipo === TipoEvento.VISTA) m.vistas = e._count._all;
      if (e.tipo === TipoEvento.CLIC_WHATSAPP) m.clicsWhatsapp = e._count._all;
      if (e.tipo === TipoEvento.FAVORITO) m.favoritos = e._count._all;
    }
    for (const c of consultas) {
      fila(c.propertyId).consultas = c._count._all;
    }
    return [...porPropiedad.values()];
  }
}
