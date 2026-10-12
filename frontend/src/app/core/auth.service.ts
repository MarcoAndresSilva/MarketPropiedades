import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'habbi_token';

export type Rol = 'ADMIN' | 'PERSONA' | 'CORREDORA' | 'INMOBILIARIA';

/** Lo que devuelve `GET /auth/me` (AuthUser de JwtStrategy en el backend). */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Rol;
  emailVerificado: boolean;
}

/** Lo que pide `POST /auth/registro` (RegistroDto en el backend). */
export interface RegistroData {
  role: Exclude<Rol, 'ADMIN'>;
  name: string;
  email: string;
  whatsapp: string;
  password: string;
}

/** Adónde llega cada cuenta después de entrar. */
export function inicioSegunRol(user: AuthUser): string {
  return user.role === 'ADMIN' ? '/admin/propiedades' : '/mi-cuenta';
}

// Una sola sesión para el admin y los anunciantes: el backend firma el mismo JWT para
// los dos y los separa por rol (RolesGuard), así que acá también. Las pantallas con
// sesión son CSR puro (RenderMode.Client, ver app.routes.server.ts), pero el service se
// inyecta en el header, que sí se renderiza en el servidor: por eso isPlatformBrowser.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly token = signal<string | null>(this.readToken());
  readonly currentUser = signal<AuthUser | null>(null);
  readonly esAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  /** Abre la sesión y trae el usuario, para que quien llama sepa a qué panel mandarlo. */
  login(email: string, password: string): Observable<AuthUser> {
    return this.abrirSesion(this.http.post<{ accessToken: string }>(`${this.baseUrl}/login`, { email, password }));
  }

  /** El backend devuelve la sesión ya abierta: la cuenta nueva entra a su panel sin pasar por el login. */
  registro(data: RegistroData): Observable<AuthUser> {
    return this.abrirSesion(this.http.post<{ accessToken: string }>(`${this.baseUrl}/registro`, data));
  }

  /**
   * Consume el link del correo. Si hay una sesión abierta en este navegador se vuelve a
   * pedir `/me`, para que el aviso de "confirma tu correo" desaparezca sin recargar.
   */
  verificarEmail(token: string): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/verificar-email`, { token })
      .pipe(switchMap(() => (this.token() ? this.loadCurrentUser() : of(null))));
  }

  reenviarVerificacion(): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/reenviar-verificacion`, {});
  }

  /** Responde lo mismo exista o no la cuenta (el backend no revela qué correos están registrados). */
  recuperarPassword(email: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/recuperar-password`, { email });
  }

  /**
   * Cambiar la contraseña invalida todos los tokens anteriores (passwordCambiadaAt en
   * JwtStrategy), incluido el de este navegador si tenía sesión: se descarta acá mismo
   * en vez de esperar al 401 de la próxima request.
   */
  restablecerPassword(token: string, password: string): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/restablecer-password`, { token, password })
      .pipe(tap(() => this.limpiarSesion()));
  }

  loadCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/me`).pipe(tap((user) => this.currentUser.set(user)));
  }

  /**
   * El usuario de la sesión, pidiéndolo a la API solo si todavía no está. Lo usan los
   * guards: el rol se confirma con el backend y no leyendo el JWT, que el navegador
   * puede tener guardado de una cuenta borrada o de antes de un cambio de contraseña.
   */
  usuario(): Observable<AuthUser | null> {
    if (!this.token()) return of(null);
    const user = this.currentUser();
    return user ? of(user) : this.loadCurrentUser();
  }

  /**
   * Cierra la sesión. Desde un panel lleva al login de ese panel; en una página pública
   * no navega: ahí el header pide `/me` al cargar, y un token vencido de alguien que solo
   * está mirando propiedades se limpia sin sacarlo de donde está.
   */
  logout(): void {
    const url = this.router.url;
    const eraAdmin = this.esAdmin() || url.startsWith('/admin');
    this.limpiarSesion();
    if (eraAdmin) {
      this.router.navigateByUrl('/admin/login');
    } else if (url.startsWith('/mi-cuenta')) {
      this.router.navigateByUrl('/ingresar');
    }
  }

  private limpiarSesion(): void {
    this.setToken(null);
    this.currentUser.set(null);
  }

  private abrirSesion(request: Observable<{ accessToken: string }>): Observable<AuthUser> {
    return request.pipe(
      tap(({ accessToken }) => this.setToken(accessToken)),
      switchMap(() => this.loadCurrentUser()),
    );
  }

  private setToken(token: string | null): void {
    this.token.set(token);
    if (!this.isBrowser) return;
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Storage bloqueado (modo privado, política del navegador) - la sesión
      // simplemente no persiste entre recargas, no rompe nada más.
    }
  }

  private readToken(): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
