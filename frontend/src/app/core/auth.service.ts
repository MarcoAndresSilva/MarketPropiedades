import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'admin_token';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// El panel de admin es CSR puro (RenderMode.Client, ver app.routes.server.ts) — nunca
// se renderiza en el servidor, pero igual se guarda con isPlatformBrowser por si algo
// más adelante instancia este service fuera de esas rutas.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly token = signal<string | null>(this.readToken());
  readonly currentUser = signal<AuthUser | null>(null);

  login(email: string, password: string): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap(({ accessToken }) => this.setToken(accessToken)),
    );
  }

  loadCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/me`).pipe(tap((user) => this.currentUser.set(user)));
  }

  logout(): void {
    this.setToken(null);
    this.currentUser.set(null);
    this.router.navigateByUrl('/admin/login');
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
