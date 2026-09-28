import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MetricasPropiedad {
  propertyId: string;
  vistas: number;
  clicsWhatsapp: number;
  favoritos: number;
  consultas: number;
}

@Injectable({ providedIn: 'root' })
export class AdminMetricasService {
  private readonly http = inject(HttpClient);

  porPropiedad(): Observable<MetricasPropiedad[]> {
    return this.http.get<MetricasPropiedad[]>(`${environment.apiUrl}/metricas/propiedades`);
  }
}
