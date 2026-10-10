import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../generated/prisma/enums';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthUser } from './current-user.decorator';

export const ROLES_ANUNCIANTE = [Role.PERSONA, Role.CORREDORA, Role.INMOBILIARIA] as const;

const ROLES_KEY = 'roles';

/** Corre después de JwtAuthGuard: deja pasar solo a los roles declarados con `Roles()`. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!roles) return true;
    const { user } = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    if (!roles.includes(user.role)) {
      throw new ForbiddenException('Tu cuenta no tiene acceso a esta sección.');
    }
    return true;
  }
}

/** Corre después de JwtAuthGuard: exige el correo verificado (para publicar o subir fotos). */
@Injectable()
export class CuentaVerificadaGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const { user } = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    if (!user.emailVerificado) {
      throw new ForbiddenException('Confirma tu correo para poder publicar.');
    }
    return true;
  }
}

const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Panel interno: solo la cuenta ADMIN. */
export const SoloAdmin = () => applyDecorators(Roles(Role.ADMIN), UseGuards(JwtAuthGuard, RolesGuard));

/** Panel del anunciante: propietario, corredora o inmobiliaria con el correo verificado. */
export const SoloAnunciante = () =>
  applyDecorators(Roles(...ROLES_ANUNCIANTE), UseGuards(JwtAuthGuard, RolesGuard, CuentaVerificadaGuard));
