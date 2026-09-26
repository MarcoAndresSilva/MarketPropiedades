import { Property } from './property.model';

const CLP_FORMATTER = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

/** Venta en UF, arriendo en CLP — la convención chilena que ya define el schema del backend. */
export function formatPrecio(property: Pick<Property, 'tipoOperacion' | 'precioUf' | 'precioClp'>): string {
  if (property.tipoOperacion === 'VENTA' && property.precioUf) {
    return `UF ${Number(property.precioUf).toLocaleString('es-CL')}`;
  }
  if (property.tipoOperacion === 'ARRIENDO' && property.precioClp) {
    return `${CLP_FORMATTER.format(property.precioClp)} / mes`;
  }
  return 'Precio a consultar';
}

const TIPO_PROPIEDAD_LABEL: Record<Property['tipoPropiedad'], string> = {
  CASA: 'Casa',
  DEPARTAMENTO: 'Departamento',
  PARCELA: 'Parcela',
  TERRENO: 'Terreno',
  OFICINA: 'Oficina',
  LOCAL_COMERCIAL: 'Local comercial',
  BODEGA: 'Bodega',
};

export function formatTipoPropiedad(tipo: Property['tipoPropiedad']): string {
  return TIPO_PROPIEDAD_LABEL[tipo];
}

/** Corta en el último espacio antes de `max` — para no partir una palabra a la mitad
 * en una meta description (ej. no terminar en "...cerca de colegios y lo"). */
export function truncarEnPalabra(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const cortado = texto.slice(0, max);
  const ultimoEspacio = cortado.lastIndexOf(' ');
  return (ultimoEspacio > 0 ? cortado.slice(0, ultimoEspacio) : cortado).trimEnd() + '…';
}

// Nombre corto de región para la línea de ubicación de las cards ("Melipilla, RM"),
// como en el render de marca. Las que no están acá ya son cortas en el catálogo oficial.
const REGION_CORTA: Record<number, string> = {
  13: 'RM',
  6: "O'Higgins",
  11: 'Aysén',
  12: 'Magallanes',
  8: 'Biobío',
};

export function formatUbicacion(comuna: Pick<Property['comuna'], 'nombre' | 'regionId' | 'region'>): string {
  const region = REGION_CORTA[comuna.regionId] ?? comuna.region?.nombre;
  return region ? `${comuna.nombre}, ${region}` : comuna.nombre;
}

