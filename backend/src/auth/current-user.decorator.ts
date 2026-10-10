import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../generated/prisma/enums';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerificado: boolean;
}

/** Inyecta el usuario autenticado en un handler protegido por `JwtAuthGuard`. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
  return request.user;
});
