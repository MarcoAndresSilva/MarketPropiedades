import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ValorUf {
  valor: number;
  fecha: string;
  /** 'mindicador' = valor del día; 'respaldo' = la API no respondió y se usa UF_RESPALDO. */
  fuente: 'mindicador' | 'respaldo';
}

const URL_UF = 'https://mindicador.cl/api/uf';
const SEIS_HORAS_MS = 6 * 60 * 60 * 1000;
// Valor de respaldo si mindicador.cl no responde y no hay UF_RESPALDO configurada:
// la UF del 29-09-2026. Un valor algo viejo sirve igual para mostrar un equivalente
// aproximado ("≈") y para filtrar; nunca se usa como precio publicado.
const UF_RESPALDO_POR_DEFECTO = 41049.01;

// Valor de la UF del día, desde mindicador.cl (API pública con los indicadores del
// Banco Central). Se guarda en memoria 6 horas: cambia una vez al día y así la API no
// se consulta en cada request. Si la API falla, se usa el último valor conocido o el
// de respaldo, en vez de romper la ficha o el catálogo.
@Injectable()
export class IndicadoresService {
  private readonly logger = new Logger(IndicadoresService.name);
  private cache: { dato: ValorUf; hasta: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  async uf(): Promise<ValorUf> {
    if (this.cache && this.cache.hasta > Date.now()) {
      return this.cache.dato;
    }
    try {
      const res = await fetch(URL_UF, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { serie?: { fecha: string; valor: number }[] };
      const hoy = body.serie?.[0];
      if (!hoy || typeof hoy.valor !== 'number') throw new Error('respuesta sin serie');
      const dato: ValorUf = { valor: hoy.valor, fecha: hoy.fecha, fuente: 'mindicador' };
      this.cache = { dato, hasta: Date.now() + SEIS_HORAS_MS };
      return dato;
    } catch (e) {
      this.logger.warn(`No se pudo obtener la UF de mindicador.cl: ${(e as Error).message}`);
      if (this.cache) return this.cache.dato;
      const valor = Number(this.config.get('UF_RESPALDO')) || UF_RESPALDO_POR_DEFECTO;
      return { valor, fecha: new Date().toISOString(), fuente: 'respaldo' };
    }
  }
}
