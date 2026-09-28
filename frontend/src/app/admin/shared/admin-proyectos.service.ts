import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Proyecto } from '../../core/proyecto.model';

export type ProyectoPayload = Omit<
  Proyecto,
  'id' | 'slug' | 'comuna' | 'fotos' | 'publicador' | 'createdAt' | 'precioDesdeUf'
> & { publicadorId: string; precioDesdeUf: number | null };

@Injectable({ providedIn: 'root' })
export class AdminProyectosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/proyectos`;

  findAll(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.baseUrl}/admin/all`);
  }

  findOne(id: string): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.baseUrl}/admin/${id}`);
  }

  create(payload: ProyectoPayload): Observable<Proyecto> {
    return this.http.post<Proyecto>(this.baseUrl, payload);
  }

  update(id: string, payload: Partial<ProyectoPayload>): Observable<Proyecto> {
    return this.http.patch<Proyecto>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<{ ok: true }> {
    return this.http.delete<{ ok: true }>(`${this.baseUrl}/${id}`);
  }

  addFoto(proyectoId: string, cloudinaryPublicId: string, orden: number): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${proyectoId}/fotos`, { cloudinaryPublicId, orden });
  }

  removeFoto(fotoId: string): Observable<{ ok: true }> {
    return this.http.delete<{ ok: true }>(`${this.baseUrl}/fotos/${fotoId}`);
  }
}
