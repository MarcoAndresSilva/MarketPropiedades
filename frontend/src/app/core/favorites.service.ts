import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'habbi:favoritos';

/**
 * Favoritos del visitante, guardados en su navegador — el comprador no tiene cuenta
 * en Habbi (decisión de producto), así que no hay dónde más guardarlos.
 * Se guarda solo el slug de cada propiedad; la página de favoritos pide los datos
 * frescos a la API, para no mostrar un precio o estado viejo.
 * SSR-safe: en el servidor la lista arranca vacía y no se toca localStorage.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly slugs = signal<string[]>(this.read());

  readonly count = computed(() => this.slugs().length);
  readonly all = this.slugs.asReadonly();

  has(slug: string): boolean {
    return this.slugs().includes(slug);
  }

  toggle(slug: string): void {
    const actual = this.slugs();
    const next = actual.includes(slug) ? actual.filter((s) => s !== slug) : [...actual, slug];
    this.slugs.set(next);
    this.write(next);
  }

  private read(): string[] {
    if (!this.isBrowser) return [];
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string') : [];
    } catch {
      return [];
    }
  }

  private write(slugs: string[]): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    } catch {
      // Navegador en modo privado o sin espacio: el favorito dura solo esta visita.
    }
  }
}
