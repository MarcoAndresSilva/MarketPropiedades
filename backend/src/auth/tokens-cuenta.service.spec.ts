import { BadRequestException } from '@nestjs/common';
import { TipoTokenCuenta } from '../generated/prisma/enums';
import type { PrismaService } from '../prisma/prisma.service';
import { TokensCuentaService, hashToken } from './tokens-cuenta.service';

const HORA_MS = 60 * 60 * 1000;

function armar({ consumidos = 1 } = {}) {
  const tokenCuenta = {
    deleteMany: vi.fn().mockReturnValue('deleteMany'),
    create: vi.fn().mockReturnValue('create'),
    updateMany: vi.fn().mockResolvedValue({ count: consumidos }),
    findUniqueOrThrow: vi.fn().mockResolvedValue({ userId: 'u1' }),
  };
  const prisma = { tokenCuenta, $transaction: vi.fn().mockResolvedValue([]) };
  return { service: new TokensCuentaService(prisma as unknown as PrismaService), tokenCuenta, prisma };
}

describe('TokensCuentaService.emitir', () => {
  it('guarda solo el hash del token, nunca el token que viaja en el link', async () => {
    const { service, tokenCuenta } = armar();
    const token = await service.emitir('u1', TipoTokenCuenta.VERIFICAR_EMAIL);
    const { data } = tokenCuenta.create.mock.calls[0][0];
    expect(data.tokenHash).toBe(hashToken(token));
    expect(data.tokenHash).not.toBe(token);
  });

  it('borra los links pendientes del mismo tipo en la misma transacción: solo vale el último', async () => {
    const { service, tokenCuenta, prisma } = armar();
    await service.emitir('u1', TipoTokenCuenta.RECUPERAR_PASSWORD);
    expect(tokenCuenta.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', tipo: TipoTokenCuenta.RECUPERAR_PASSWORD, usadoAt: null },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(['deleteMany', 'create']);
  });

  it('el de recuperación vence en 1 hora y el de verificación en 48', async () => {
    const { service, tokenCuenta } = armar();
    const antes = Date.now();
    await service.emitir('u1', TipoTokenCuenta.RECUPERAR_PASSWORD);
    await service.emitir('u1', TipoTokenCuenta.VERIFICAR_EMAIL);
    const [recuperar, verificar] = tokenCuenta.create.mock.calls.map(([arg]) => arg.data.expiraAt.getTime() - antes);
    expect(recuperar).toBeGreaterThanOrEqual(HORA_MS);
    expect(recuperar).toBeLessThan(HORA_MS + 1000);
    expect(verificar).toBeGreaterThanOrEqual(48 * HORA_MS);
  });
});

describe('TokensCuentaService.consumir', () => {
  it('consume solo un token sin usar y vigente, y devuelve su usuario', async () => {
    const { service, tokenCuenta } = armar();
    await expect(service.consumir('abc', TipoTokenCuenta.VERIFICAR_EMAIL)).resolves.toBe('u1');
    const { where } = tokenCuenta.updateMany.mock.calls[0][0];
    // Este filtro es lo que hace el uso único atómico: sin `usadoAt: null` el link se
    // podría reutilizar, sin `expiraAt` serviría para siempre.
    expect(where).toMatchObject({ tokenHash: hashToken('abc'), tipo: TipoTokenCuenta.VERIFICAR_EMAIL, usadoAt: null });
    expect(where.expiraAt.gt).toBeInstanceOf(Date);
  });

  it('un link usado, vencido o inventado responde 400', async () => {
    const { service } = armar({ consumidos: 0 });
    await expect(service.consumir('abc', TipoTokenCuenta.RECUPERAR_PASSWORD)).rejects.toBeInstanceOf(BadRequestException);
  });
});
