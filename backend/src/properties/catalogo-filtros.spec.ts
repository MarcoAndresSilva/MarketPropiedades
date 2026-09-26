import { ordenBy, precioWhere } from './properties.service';
import { TipoOperacion } from '../generated/prisma/enums';

describe('precioWhere', () => {
  it('filtra venta por precio en UF', () => {
    expect(precioWhere({ tipoOperacion: TipoOperacion.VENTA, precioMin: 2000, precioMax: 4000 })).toEqual({
      precioUf: { gte: 2000, lte: 4000 },
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
  it('ordena venta por precio en UF', () => {
    expect(ordenBy({ tipoOperacion: TipoOperacion.VENTA, orden: 'precio_asc' })[0]).toEqual({
      precioUf: { sort: 'asc', nulls: 'last' },
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
