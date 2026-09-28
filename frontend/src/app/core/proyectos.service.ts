import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EtapaProyecto, PaginatedProyectos, Proyecto } from './proyecto.model';

export interface ProyectosFilters {
  comunaId?: string;
  etapa?: EtapaProyecto;
  destacado?: boolean;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class ProyectosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/proyectos`;

  findPublished(filters: ProyectosFilters = {}): Observable<PaginatedProyectos> {
    let params = new HttpParams();
    if (filters.comunaId) params = params.set('comunaId', filters.comunaId);
    if (filters.etapa) params = params.set('etapa', filters.etapa);
    if (filters.destacado) params = params.set('destacado', 'true');
    if (filters.page) params = params.set('page', filters.page);
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize);
    return this.http.get<PaginatedProyectos>(this.baseUrl, { params });
  }

  findBySlug(slug: string): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.baseUrl}/${slug}`);
  }
}
