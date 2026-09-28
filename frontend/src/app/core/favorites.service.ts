import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MetricasService } from './metricas.service';

const STORAGE_KEY = 'habbi:favoritos';
const PREFIJO_PROYECTO = 'proyecto:';

/** Clave de favorito de un proyecto. Las propiedades usan su slug a secas (así estaban
 * guardadas antes de que existieran los proyectos, y siguen valiendo). */
export function claveProyecto(slug: string): string {
  return PREFIJO_PROYECTO + slug;
}

export function esClaveProyecto(clave: string): boolean {
  return clave.startsWith(PREFIJO_PROYECTO);
}

export function slugDeClave(clave: string): string {
  return esClaveProyecto(clave) ? clave.slice(PREFIJO_PROYECTO.length) : clave;
}

/**
 * Favoritos del visitante, guardados en su navegador — el comprador no tiene cuenta
 * en Habbi (decisión de producto), así que no hay dónde más guardarlos.
 * Se guarda solo el slug de cada propiedad (o "proyecto:<slug>" para un proyecto); la
 * página de favoritos pide los datos frescos a la API, para no mostrar un precio viejo.
 * Guardar una propiedad suma la métrica "favorito" que después ve el anunciante.
 * SSR-safe: en el servidor la lista arranca vacía y no se toca localStorage.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly metricas = inject(MetricasService);
  private readonly slugs = signal<string[]>(this.read());

  readonly count = computed(() => this.slugs().length);
  readonly all = this.slugs.asReadonly();

  has(slug: string): boolean {
    return this.slugs().includes(slug);
  }

  toggle(clave: string): void {
    const actual = this.slugs();
    const agregando = !actual.includes(clave);
    const next = agregando ? [...actual, clave] : actual.filter((s) => s !== clave);
    this.slugs.set(next);
    this.write(next);
    if (agregando && !esClaveProyecto(clave)) {
      this.metricas.registrar(clave, 'FAVORITO');
    }
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
