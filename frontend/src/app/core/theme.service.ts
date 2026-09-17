import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/**
 * Maneja el tema claro/oscuro.
 *
 * - Si el usuario ya eligió uno, se respeta (localStorage).
 * - Si no, se usa la preferencia del sistema (`prefers-color-scheme`) — a diferencia
 *   de un producto interno/técnico, acá el público es masivo y no hay razón para
 *   forzar un default distinto al que ya configuró en su equipo.
 * - Escribe `data-theme` en <html>, que es lo que leen los tokens de _theme.scss.
 * - SSR-safe: en el server no toca `document`/`localStorage`/`matchMedia`.
 * - El parpadeo antes de hidratar lo evita el script inline de index.html.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _theme = signal<Theme>(this.readInitialTheme());

  readonly theme = this._theme.asReadonly();

  constructor() {
    effect(() => {
      const value = this._theme();
      if (!this.isBrowser) {
        return;
      }
      document.documentElement.setAttribute('data-theme', value);
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch {
        // Modo incógnito o almacenamiento bloqueado: seguimos sin persistir.
      }
    });
  }

  toggle(): void {
    this._theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  set(value: Theme): void {
    this._theme.set(value);
  }

  private readInitialTheme(): Theme {
    if (!this.isBrowser) {
      return 'light';
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // ignora
    }
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      // jsdom (tests) no implementa matchMedia — cae a claro, el default seguro.
      return 'light';
    }
  }
}
