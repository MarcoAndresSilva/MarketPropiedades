import { Comuna, Publicador } from './property.model';

// Espeja backend/src/proyectos (mantenido a mano, igual que property.model.ts).

export type EtapaProyecto = 'EN_PLANIFICACION' | 'EN_CONSTRUCCION' | 'ENTREGA_INMEDIATA';

export interface ProyectoFoto {
  id: string;
  cloudinaryPublicId: string;
  orden: number;
}

export interface Proyecto {
  id: string;
  slug: string;
  estado: 'BORRADOR' | 'PUBLICADA' | 'PAUSADA' | 'CERRADA';
  nombre: string;
  etapa: EtapaProyecto;
  entrega: string | null;
  destacado: boolean;
  comunaId: string;
  comuna: Comuna;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  descripcion: string;
  precioDesdeUf: string | null;
  dormitoriosMin: number | null;
  dormitoriosMax: number | null;
  banosMin: number | null;
  banosMax: number | null;
  m2Min: number | null;
  m2Max: number | null;
  unidades: number | null;
  fotos: ProyectoFoto[];
  publicador: Publicador;
  createdAt: string;
}

export interface PaginatedProyectos {
  items: Proyecto[];
  total: number;
  page: number;
  pageSize: number;
}

export const ETAPA_LABEL: Record<EtapaProyecto, string> = {
  EN_PLANIFICACION: 'En planificación',
  EN_CONSTRUCCION: 'En construcción',
  ENTREGA_INMEDIATA: 'Entrega inmediata',
};

/** "1 – 3", "2" o null si no hay datos: los rangos de las cards y la ficha de proyecto. */
export function formatRango(min: number | null, max: number | null, sufijo = ''): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null && min !== max) return `${min} – ${max}${sufijo}`;
  return `${min ?? max}${sufijo}`;
}
