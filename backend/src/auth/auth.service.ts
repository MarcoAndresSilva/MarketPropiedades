import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { PlantillasCorreo } from '../mail/plantillas-correo';
import { UsersService } from '../users/users.service';
import { TipoTokenCuenta } from '../generated/prisma/enums';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';
import { RestablecerPasswordDto } from './dto/token.dto';
import { TokensCuentaService } from './tokens-cuenta.service';

type Sesion = { accessToken: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly tokens: TokensCuentaService,
    private readonly mail: MailService,
    private readonly plantillas: PlantillasCorreo,
  ) {}

  async login(dto: LoginDto): Promise<Sesion> {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await this.verify(user.passwordHash, dto.password))) {
      // Mismo mensaje exista o no el usuario: no revela qué correos están registrados.
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return this.firmar(user);
  }

  /**
   * Registro público de anunciantes. La cuenta queda con sesión abierta pero sin
   * verificar: puede entrar a su panel, y para publicar tiene que abrir el link del
   * correo (CuentaVerificadaGuard).
   */
  async registro(dto: RegistroDto): Promise<Sesion> {
    const user = await this.users.create(dto, { verificada: false });
    await this.enviarVerificacion(user);
    return this.firmar(user);
  }

  async verificarEmail(token: string): Promise<{ ok: true }> {
    const userId = await this.tokens.consumir(token, TipoTokenCuenta.VERIFICAR_EMAIL);
    await this.prisma.user.update({ where: { id: userId }, data: { emailVerificadoAt: new Date() } });
    return { ok: true };
  }

  async reenviarVerificacion(userId: string): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.emailVerificadoAt) {
      await this.enviarVerificacion(user);
    }
    return { ok: true };
  }

  /** Responde lo mismo exista o no la cuenta, igual que el login. */
  async recuperarPassword(email: string): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      const token = await this.tokens.emitir(user.id, TipoTokenCuenta.RECUPERAR_PASSWORD);
      await this.mail.enviar(this.plantillas.recuperarPassword(user.email, user.name, token));
    }
    return { ok: true };
  }

  /**
   * Cambia la contraseña con el link del correo. `passwordCambiadaAt` cierra las sesiones
   * abiertas (JwtStrategy), y el correo queda verificado: abrir el link prueba que el
   * dueño lo lee.
   */
  async restablecerPassword(dto: RestablecerPasswordDto): Promise<{ ok: true }> {
    const userId = await this.tokens.consumir(dto.token, TipoTokenCuenta.RECUPERAR_PASSWORD);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await argon2.hash(dto.password),
        passwordCambiadaAt: new Date(),
        emailVerificadoAt: user.emailVerificadoAt ?? new Date(),
      },
    });
    return { ok: true };
  }

  private async enviarVerificacion(user: { id: string; email: string; name: string }) {
    const token = await this.tokens.emitir(user.id, TipoTokenCuenta.VERIFICAR_EMAIL);
    await this.mail.enviar(this.plantillas.verificarEmail(user.email, user.name, token));
  }

  private async firmar(user: { id: string; email: string; role: string }): Promise<Sesion> {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return { accessToken };
  }

  private async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      // Hash corrupto en la BD: se trata como credencial inválida, no como 500.
      return false;
    }
  }
}
