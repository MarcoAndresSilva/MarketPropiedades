import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthService, inicioSegunRol } from './auth.service';

/**
 * Deja pasar solo a la cuenta que corresponde: sin sesión, al login de esa zona; con
 * sesión pero de otro rol, a su propio panel. Es comodidad, no seguridad: la API ya
 * rechaza con 403 lo que cada rol no puede hacer (RolesGuard en el backend).
 */
function guardPorRol(esPermitido: (rol: string) => boolean, login: string): CanActivateFn {
  return (): Observable<boolean | UrlTree> => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.usuario().pipe(
      map((user) => {
        if (!user) return router.createUrlTree([login]);
        return esPermitido(user.role) ? true : router.parseUrl(inicioSegunRol(user));
      }),
      // Token vencido o cuenta borrada: el interceptor ya cerró la sesión con el 401.
      catchError(() => of(router.createUrlTree([login]))),
    );
  };
}

export const adminGuard = guardPorRol((rol) => rol === 'ADMIN', '/admin/login');

export const anuncianteGuard = guardPorRol((rol) => rol !== 'ADMIN', '/ingresar');
