import { Property } from './property.model';

const CLP_FORMATTER = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

const UF_FORMATTER = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

/** "$380.000": pesos chilenos sin decimales. Un solo formateador para todo el sitio. */
export function formatClp(valor: number): string {
  return CLP_FORMATTER.format(valor);
}

/**
 * El precio tal como lo publicó el anunciante: venta en UF o en pesos, arriendo en pesos
 * por mes. Es el que manda; el equivalente en la otra moneda es solo referencia.
 */
export function formatPrecio(property: Pick<Property, 'tipoOperacion' | 'precioUf' | 'precioClp'>): string {
  if (property.tipoOperacion === 'VENTA' && property.precioUf) {
    return `UF ${Number(property.precioUf).toLocaleString('es-CL')}`;
  }
  if (property.tipoOperacion === 'VENTA' && property.precioClp) {
    return CLP_FORMATTER.format(property.precioClp);
  }
  if (property.tipoOperacion === 'ARRIENDO' && property.precioClp) {
    return `${CLP_FORMATTER.format(property.precioClp)} / mes`;
  }
  return 'Precio a consultar';
}

/**
 * Equivalente de una venta en la otra moneda, con la UF del día: "≈ $352.950.981" para
 * una publicada en UF, "≈ UF 6.821" para una publicada en pesos. Null si no aplica
 * (arriendo, sin precio, o sin valor de UF todavía).
 */
export function formatPrecioEquivalente(
  property: Pick<Property, 'tipoOperacion' | 'precioUf' | 'precioClp'>,
  valorUf: number | null,
): string | null {
  if (property.tipoOperacion !== 'VENTA' || !valorUf) return null;
  if (property.precioUf) {
    return `≈ ${CLP_FORMATTER.format(Math.round(Number(property.precioUf) * valorUf))}`;
  }
  if (property.precioClp) {
    return `≈ UF ${UF_FORMATTER.format(property.precioClp / valorUf)}`;
  }
  return null;
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


/** Cómo se muestra cada tipo de cuenta (ficha, formularios del admin). */
export const ETIQUETA_ROL: Record<Property['publicador']['role'], string> = {
  ADMIN: 'Habbi',
  PERSONA: 'Propietario',
  CORREDORA: 'Corredora',
  INMOBILIARIA: 'Inmobiliaria',
};
