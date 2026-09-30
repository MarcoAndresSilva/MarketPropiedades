import { ordenBy, precioRefUf, precioWhere } from './properties.service';
import { TipoOperacion } from '../generated/prisma/enums';

describe('precioWhere', () => {
  it('filtra venta contra la referencia en UF (incluye ventas publicadas en pesos)', () => {
    expect(precioWhere({ tipoOperacion: TipoOperacion.VENTA, precioMin: 2000, precioMax: 4000 })).toEqual({
      precioRefUf: { gte: 2000, lte: 4000 },
    });
  });

  it('filtra arriendo por precio en CLP', () => {
    expect(precioWhere({ tipoOperacion: TipoOperacion.ARRIENDO, precioMin: 400000 })).toEqual({
      precioClp: { gte: 400000, lte: undefined },
    });
  });

  it('ignora el rango si no viene la operación (no se sabe la unidad)', () => {
    expect(precioWhere({ precioMin: 2000, precioMax: 4000 })).toEqual({});
  });

  it('no filtra si no viene ningún extremo del rango', () => {
    expect(precioWhere({ tipoOperacion: TipoOperacion.VENTA })).toEqual({});
  });
});

describe('ordenBy', () => {
  it('ordena venta por la referencia en UF', () => {
    expect(ordenBy({ tipoOperacion: TipoOperacion.VENTA, orden: 'precio_asc' })[0]).toEqual({
      precioRefUf: { sort: 'asc', nulls: 'last' },
    });
  });

  it('ordena arriendo por precio en CLP, de mayor a menor', () => {
    expect(ordenBy({ tipoOperacion: TipoOperacion.ARRIENDO, orden: 'precio_desc' })[0]).toEqual({
      precioClp: { sort: 'desc', nulls: 'last' },
    });
  });

  it('sin operación no ordena por precio: destacadas primero', () => {
    expect(ordenBy({ orden: 'precio_asc' })[0]).toEqual({ destacada: 'desc' });
  });
});

describe('precioRefUf', () => {
  const UF = 41049.01;

  it('una venta en UF usa su propio precio', () => {
    expect(precioRefUf({ tipoOperacion: TipoOperacion.VENTA, precioUf: 8600, precioClp: null }, UF)).toBe(8600);
  });

  it('una venta en pesos se divide por la UF del día', () => {
    expect(precioRefUf({ tipoOperacion: TipoOperacion.VENTA, precioUf: null, precioClp: 280_000_000 }, UF)).toBe(6821.11);
  });

  it('un arriendo no tiene referencia', () => {
    expect(precioRefUf({ tipoOperacion: TipoOperacion.ARRIENDO, precioClp: 450_000 }, UF)).toBeNull();
  });
});
