import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';
import { RecuperarPasswordDto } from './dto/recuperar-password.dto';
import { RestablecerPasswordDto, VerificarEmailDto } from './dto/token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, type AuthUser } from './current-user.decorator';

const DIEZ_MINUTOS = 600_000;

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Anti fuerza bruta: 5 intentos por minuto por IP, por encima del límite global.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // Frena la creación masiva de cuentas desde una misma IP.
  @Throttle({ default: { limit: 5, ttl: DIEZ_MINUTOS } })
  @Post('registro')
  registro(@Body() dto: RegistroDto) {
    return this.auth.registro(dto);
  }

  // Público: el link del correo puede abrirse en otro dispositivo, sin sesión.
  @Throttle({ default: { limit: 10, ttl: DIEZ_MINUTOS } })
  @HttpCode(200)
  @Post('verificar-email')
  verificarEmail(@Body() dto: VerificarEmailDto) {
    return this.auth.verificarEmail(dto.token);
  }

  // Cada envío es un correo real (y Resend cobra por volumen): pocos por IP.
  @Throttle({ default: { limit: 3, ttl: DIEZ_MINUTOS } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('reenviar-verificacion')
  reenviarVerificacion(@CurrentUser() user: AuthUser) {
    return this.auth.reenviarVerificacion(user.id);
  }

  @Throttle({ default: { limit: 3, ttl: DIEZ_MINUTOS } })
  @HttpCode(200)
  @Post('recuperar-password')
  recuperarPassword(@Body() dto: RecuperarPasswordDto) {
    return this.auth.recuperarPassword(dto.email);
  }

  @Throttle({ default: { limit: 5, ttl: DIEZ_MINUTOS } })
  @HttpCode(200)
  @Post('restablecer-password')
  restablecerPassword(@Body() dto: RestablecerPasswordDto) {
    return this.auth.restablecerPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
