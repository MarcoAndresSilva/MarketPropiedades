import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthService, AuthUser, inicioSegunRol } from './auth.service';

/**
 * Deja pasar solo a la cuenta que corresponde: sin sesión, al login de esa zona; con
 * sesión pero de otro rol (o sin el correo verificado), a su propio panel. Es comodidad,
 * no seguridad: la API ya rechaza con 403 lo que cada cuenta no puede hacer.
 */
function guardPorCuenta(esPermitido: (user: AuthUser) => boolean, login: string): CanActivateFn {
  return (): Observable<boolean | UrlTree> => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.usuario().pipe(
      map((user) => {
        if (!user) return router.createUrlTree([login]);
        return esPermitido(user) ? true : router.parseUrl(inicioSegunRol(user));
      }),
      // Token vencido o cuenta borrada: el interceptor ya cerró la sesión con el 401.
      catchError(() => of(router.createUrlTree([login]))),
    );
  };
}

export const adminGuard = guardPorCuenta((user) => user.role === 'ADMIN', '/admin/login');

export const anuncianteGuard = guardPorCuenta((user) => user.role !== 'ADMIN', '/ingresar');

/** Crear y editar propiedades exige el correo verificado (CuentaVerificadaGuard en la API). */
export const anuncianteVerificadoGuard = guardPorCuenta(
  (user) => user.role !== 'ADMIN' && user.emailVerificado,
  '/ingresar',
);
