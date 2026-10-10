import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from './current-user.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number; // segundos, lo agrega jsonwebtoken al firmar
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /** Corre en cada request con Bearer válido. Revalida contra la BD: si el usuario fue
   * borrado, o cambió su contraseña después de emitido el token, el token deja de servir
   * aunque no haya expirado. */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || tokenAnteriorAlCambioDePassword(payload.iat, user.passwordCambiadaAt)) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerificado: user.emailVerificadoAt !== null,
    };
  }
}

/** `iat` va en segundos enteros: un login en el mismo segundo del cambio sigue valiendo. */
export function tokenAnteriorAlCambioDePassword(iat: number, passwordCambiadaAt: Date | null): boolean {
  return passwordCambiadaAt !== null && iat < Math.floor(passwordCambiadaAt.getTime() / 1000);
}
