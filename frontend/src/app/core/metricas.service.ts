import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export type TipoEvento = 'VISTA' | 'CLIC_WHATSAPP' | 'FAVORITO';

const VISITANTE_KEY = 'habbi:visitante';

/**
 * Registra las métricas básicas de una ficha (vista, clic a WhatsApp, favorito) para el
 * panel del anunciante. Solo corre en el navegador (en SSR no hay visitante real) y es
 * "dispara y olvida": si falla, el visitante no se entera ni se interrumpe nada.
 * `visitante` es un id anónimo al azar guardado en este navegador — no identifica a
 * nadie, solo permite al backend no contar dos veces la misma vista en el día.
 */
@Injectable({ providedIn: 'root' })
export class MetricasService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  registrar(slug: string, tipo: TipoEvento): void {
    if (!this.isBrowser) return;
    this.http
      .post(`${environment.apiUrl}/properties/${slug}/eventos`, { tipo, visitante: this.visitante() })
      .subscribe({ error: () => undefined });
  }

  private visitante(): string {
    try {
      let id = localStorage.getItem(VISITANTE_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(VISITANTE_KEY, id);
      }
      return id;
    } catch {
      // Sin localStorage (modo privado estricto): un id por visita, igual sirve.
      return crypto.randomUUID();
    }
  }
}
