import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TipoTokenCuenta } from '../generated/prisma/enums';

const HORA_MS = 60 * 60 * 1000;

// Cuánto vale cada link: el de verificación da tiempo de abrir el correo otro día; el de
// recuperación es corto porque quien lo intercepte puede tomar la cuenta.
const VIGENCIA_MS: Record<TipoTokenCuenta, number> = {
  [TipoTokenCuenta.VERIFICAR_EMAIL]: 48 * HORA_MS,
  [TipoTokenCuenta.RECUPERAR_PASSWORD]: HORA_MS,
};

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Tokens de un solo uso para los links que llegan por correo. El token viaja solo en el
// link; en la base queda su SHA-256 (no hace falta argon2: son 32 bytes aleatorios, no
// una contraseña que se pueda adivinar por diccionario).
@Injectable()
export class TokensCuentaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crea un token nuevo e invalida los pendientes del mismo tipo: solo vale el último link. */
  async emitir(userId: string, tipo: TipoTokenCuenta): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await this.prisma.$transaction([
      this.prisma.tokenCuenta.deleteMany({ where: { userId, tipo, usadoAt: null } }),
      this.prisma.tokenCuenta.create({
        data: { userId, tipo, tokenHash: hashToken(token), expiraAt: new Date(Date.now() + VIGENCIA_MS[tipo]) },
      }),
    ]);
    return token;
  }

  /**
   * Marca el token como usado y devuelve el id de su usuario. El `updateMany` con
   * `usadoAt: null` en el filtro es atómico: si el mismo link se abre dos veces a la vez,
   * solo una de las dos requests lo consume.
   */
  async consumir(token: string, tipo: TipoTokenCuenta): Promise<string> {
    const tokenHash = hashToken(token);
    const { count } = await this.prisma.tokenCuenta.updateMany({
      where: { tokenHash, tipo, usadoAt: null, expiraAt: { gt: new Date() } },
      data: { usadoAt: new Date() },
    });
    if (count === 0) {
      throw new BadRequestException('El link no es válido o ya venció. Pide uno nuevo.');
    }
    const { userId } = await this.prisma.tokenCuenta.findUniqueOrThrow({ where: { tokenHash }, select: { userId: true } });
    return userId;
  }
}
