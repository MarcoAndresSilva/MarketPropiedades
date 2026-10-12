import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Solo agrega el header a requests contra nuestra propia API - nunca a Google Fonts,
// Cloudinary, ni OpenStreetMap. Si el backend responde 401 a una request que llevaba
// token (vencido, cuenta borrada o contraseña cambiada, ver JwtStrategy en el backend),
// la sesión local se limpia sola en vez de dejar pantallas que fallan en silencio. Un 401
// sin token es otra cosa (la clave mal escrita en el login) y lo maneja el formulario.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const token = auth.token();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err) => {
      if (err.status === 401 && token) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
