import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NuevaConsulta {
  nombre: string;
  email?: string;
  telefono?: string;
  mensaje: string;
  /** Campo trampa: el formulario lo oculta, una persona nunca lo llena. */
  sitioWeb?: string;
}

@Injectable({ providedIn: 'root' })
export class ConsultasService {
  private readonly http = inject(HttpClient);

  enviar(slug: string, consulta: NuevaConsulta): Observable<{ ok: true }> {
    return this.http.post<{ ok: true }>(`${environment.apiUrl}/properties/${slug}/consultas`, consulta);
  }
}
