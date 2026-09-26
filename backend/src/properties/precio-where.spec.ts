import { precioWhere } from './properties.service';
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
