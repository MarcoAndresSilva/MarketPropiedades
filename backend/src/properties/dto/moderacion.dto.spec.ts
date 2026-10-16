import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RechazarPropertyDto } from './moderacion.dto';

const errores = (motivo: unknown) => validateSync(plainToInstance(RechazarPropertyDto, { motivo }));

describe('RechazarPropertyDto', () => {
  it('rechaza un motivo que solo llega al mínimo con espacios de relleno', () => {
    expect(errores('         x')).not.toHaveLength(0);
  });

  it('acepta un motivo real y lo guarda recortado', () => {
    const dto = plainToInstance(RechazarPropertyDto, { motivo: '  Faltan fotos del baño.  ' });
    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.motivo).toBe('Faltan fotos del baño.');
  });
});
