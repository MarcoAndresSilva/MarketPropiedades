// Espeja las formas que devuelve el backend (ver backend/src/properties) — sin
// generar tipos automáticamente todavía, se mantienen a mano mientras la API es chica.

export type TipoOperacion = 'VENTA' | 'ARRIENDO';

export type TipoPropiedad =
  | 'CASA'
  | 'DEPARTAMENTO'
  | 'PARCELA'
  | 'TERRENO'
  | 'OFICINA'
  | 'LOCAL_COMERCIAL'
  | 'BODEGA';

// EN_REVISION y RECHAZADA son la moderación de lo que publican los anunciantes (Fase 35).
export type EstadoPublicacion = 'BORRADOR' | 'EN_REVISION' | 'RECHAZADA' | 'PUBLICADA' | 'PAUSADA' | 'CERRADA';

export interface Region {
  id: number;
  nombre: string;
}

export interface Comuna {
  id: string;
  nombre: string;
  regionId: number;
  region: Region;
}

export interface PropertyFoto {
  id: string;
  cloudinaryPublicId: string;
  orden: number;
}

export interface Publicador {
  id: string;
  name: string;
  whatsapp: string | null;
  role: 'ADMIN' | 'PERSONA' | 'CORREDORA' | 'INMOBILIARIA';
}

export interface Property {
  id: string;
  slug: string;
  estado: EstadoPublicacion;
  /** Solo en RECHAZADA: lo que el anunciante tiene que corregir. */
  motivoRechazo: string | null;
  titulo: string;
  tipoOperacion: TipoOperacion;
  tipoPropiedad: TipoPropiedad;
  destacada: boolean;
  comunaId: string;
  comuna: Comuna;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  precioUf: string | null;
  precioClp: number | null;
  m2Construidos: number | null;
  m2Terreno: number | null;
  dormitorios: number | null;
  banos: number | null;
  estacionamientos: number | null;
  bodegas: number | null;
  gastosComunesClp: number | null;
  descripcion: string;
  videoUrl: string | null;
  fotos: PropertyFoto[];
  publicador: Publicador;
  createdAt: string;
}

export interface PaginatedProperties {
  items: Property[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CatalogFilters {
  comunaId?: string;
  tipoOperacion?: TipoOperacion;
  tipoPropiedad?: TipoPropiedad;
  dormitoriosMin?: number;
  /** En UF para VENTA, en CLP para ARRIENDO (misma convención que el precio guardado). */
  precioMin?: number;
  precioMax?: number;
  orden?: 'recientes' | 'precio_asc' | 'precio_desc';
  page?: number;
  pageSize?: number;
}
