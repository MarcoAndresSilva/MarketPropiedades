import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConsultaAdmin {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  mensaje: string;
  leida: boolean;
  createdAt: string;
  property: { id: string; slug: string; titulo: string };
}

@Injectable({ providedIn: 'root' })
export class AdminConsultasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/consultas`;

  findAll(): Observable<ConsultaAdmin[]> {
    return this.http.get<ConsultaAdmin[]>(this.baseUrl);
  }

  marcarLeida(id: string, leida: boolean): Observable<ConsultaAdmin> {
    return this.http.patch<ConsultaAdmin>(`${this.baseUrl}/${id}`, { leida });
  }
}
