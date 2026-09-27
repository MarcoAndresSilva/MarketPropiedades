import { erroresDeRango } from './proyectos.service';

describe('erroresDeRango', () => {
  it('acepta rangos válidos o incompletos', () => {
    expect(erroresDeRango({ dormitoriosMin: 1, dormitoriosMax: 3, m2Min: 45 })).toEqual([]);
  });

  it('rechaza cada rango invertido con su nombre', () => {
    expect(erroresDeRango({ dormitoriosMin: 3, dormitoriosMax: 1, m2Min: 95, m2Max: 45 })).toEqual([
      'El mínimo de dormitorios no puede ser mayor que el máximo.',
      'El mínimo de m² no puede ser mayor que el máximo.',
    ]);
  });
});
