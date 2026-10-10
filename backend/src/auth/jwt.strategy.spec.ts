import { tokenAnteriorAlCambioDePassword } from './jwt.strategy';

describe('tokenAnteriorAlCambioDePassword', () => {
  const cambio = new Date('2026-10-03T12:00:00.500Z');
  const segundoDelCambio = Math.floor(cambio.getTime() / 1000);

  it('sin cambio de contraseña, todo token vale', () => {
    expect(tokenAnteriorAlCambioDePassword(0, null)).toBe(false);
  });

  it('invalida los tokens emitidos antes del cambio', () => {
    expect(tokenAnteriorAlCambioDePassword(segundoDelCambio - 1, cambio)).toBe(true);
  });

  it('acepta un login en el mismo segundo del cambio o después', () => {
    expect(tokenAnteriorAlCambioDePassword(segundoDelCambio, cambio)).toBe(false);
    expect(tokenAnteriorAlCambioDePassword(segundoDelCambio + 60, cambio)).toBe(false);
  });
});
