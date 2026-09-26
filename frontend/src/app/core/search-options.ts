import { TipoOperacion, TipoPropiedad } from './property.model';

// Opciones de búsqueda compartidas por el buscador de la home y la página de listado.

export interface RangoPrecio {
  label: string;
  min?: number;
  max?: number;
}

// Tramos según la convención chilena del resto del sitio: venta en UF, arriendo en CLP.
export const RANGOS_PRECIO: Record<TipoOperacion, RangoPrecio[]> = {
  VENTA: [
    { label: 'Hasta UF 2.000', max: 2000 },
    { label: 'UF 2.000 – 4.000', min: 2000, max: 4000 },
    { label: 'UF 4.000 – 6.000', min: 4000, max: 6000 },
    { label: 'UF 6.000 – 10.000', min: 6000, max: 10000 },
    { label: 'Más de UF 10.000', min: 10000 },
  ],
  ARRIENDO: [
    { label: 'Hasta $400.000', max: 400000 },
    { label: '$400.000 – $600.000', min: 400000, max: 600000 },
    { label: '$600.000 – $900.000', min: 600000, max: 900000 },
    { label: '$900.000 – $1.500.000', min: 900000, max: 1500000 },
    { label: 'Más de $1.500.000', min: 1500000 },
  ],
};

export const TIPOS_PROPIEDAD: { value: TipoPropiedad; label: string }[] = [
  { value: 'CASA', label: 'Casa' },
  { value: 'DEPARTAMENTO', label: 'Departamento' },
  { value: 'PARCELA', label: 'Parcela' },
  { value: 'TERRENO', label: 'Terreno' },
  { value: 'OFICINA', label: 'Oficina' },
  { value: 'LOCAL_COMERCIAL', label: 'Local comercial' },
  { value: 'BODEGA', label: 'Bodega' },
];

export type Orden = 'recientes' | 'precio_asc' | 'precio_desc';

/** Índice del tramo que coincide exactamente con min/max (para reflejar la URL en el select). */
export function indiceRango(operacion: TipoOperacion, min?: number, max?: number): string {
  const i = RANGOS_PRECIO[operacion].findIndex((r) => r.min === min && r.max === max);
  return i >= 0 ? String(i) : '';
}
