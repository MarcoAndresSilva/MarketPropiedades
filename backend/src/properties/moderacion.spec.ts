import { EstadoPublicacion } from '../generated/prisma/enums';
import { estadoTrasEditar, puedeCambiarEstado } from './moderacion';

const { BORRADOR, EN_REVISION, RECHAZADA, PUBLICADA, PAUSADA, CERRADA } = EstadoPublicacion;

describe('puedeCambiarEstado', () => {
  it('deja enviar a revisión un borrador o una rechazada', () => {
    expect(puedeCambiarEstado(BORRADOR, EN_REVISION)).toBe(true);
    expect(puedeCambiarEstado(RECHAZADA, EN_REVISION)).toBe(true);
  });

  it('nunca deja publicar algo que el admin no aprobó', () => {
    expect(puedeCambiarEstado(BORRADOR, PUBLICADA)).toBe(false);
    expect(puedeCambiarEstado(EN_REVISION, PUBLICADA)).toBe(false);
    expect(puedeCambiarEstado(RECHAZADA, PUBLICADA)).toBe(false);
  });

  it('deja pausar, reanudar y cerrar una propiedad aprobada', () => {
    expect(puedeCambiarEstado(PUBLICADA, PAUSADA)).toBe(true);
    expect(puedeCambiarEstado(PAUSADA, PUBLICADA)).toBe(true);
    expect(puedeCambiarEstado(PUBLICADA, CERRADA)).toBe(true);
  });

  it('una cerrada no vuelve a ningún estado', () => {
    for (const estado of Object.values(EstadoPublicacion)) {
      expect(puedeCambiarEstado(CERRADA, estado)).toBe(false);
    }
  });
});

describe('estadoTrasEditar', () => {
  it('manda a revisión lo que ya estaba aprobado', () => {
    expect(estadoTrasEditar(PUBLICADA)).toBe(EN_REVISION);
    expect(estadoTrasEditar(PAUSADA)).toBe(EN_REVISION);
  });

  it('no cambia lo que todavía no es público', () => {
    expect(estadoTrasEditar(BORRADOR)).toBe(BORRADOR);
    expect(estadoTrasEditar(RECHAZADA)).toBe(RECHAZADA);
    expect(estadoTrasEditar(EN_REVISION)).toBe(EN_REVISION);
  });
});
