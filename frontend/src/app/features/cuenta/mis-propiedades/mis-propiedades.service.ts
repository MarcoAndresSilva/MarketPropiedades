import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreatePropertyPayload, EstadoPublicacion, Property } from '../../../core/property.model';

/** Lo que devuelve `/mis-propiedades`: la propiedad sin el publicador, que siempre es uno mismo. */
export type MiPropiedad = Omit<Property, 'publicador'>;

/**
 * Lo que carga el anunciante: lo mismo que el admin menos el publicador, el estado (va por
 * `cambiarEstado`, que valida la transición) y destacada (servicio pagado). Ver
 * PropiedadAnuncianteDto en el backend.
 */
export type PropiedadAnunciantePayload = Omit<CreatePropertyPayload, 'publicadorId' | 'estado' | 'destacada'>;

@Injectable({ providedIn: 'root' })
export class MisPropiedadesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/mis-propiedades`;

  findAll(): Observable<MiPropiedad[]> {
    return this.http.get<MiPropiedad[]>(this.baseUrl);
  }

  findOne(id: string): Observable<MiPropiedad> {
    return this.http.get<MiPropiedad>(`${this.baseUrl}/${id}`);
  }

  create(payload: PropiedadAnunciantePayload): Observable<MiPropiedad> {
    return this.http.post<MiPropiedad>(this.baseUrl, payload);
  }

  update(id: string, payload: Partial<PropiedadAnunciantePayload>): Observable<MiPropiedad> {
    return this.http.patch<MiPropiedad>(`${this.baseUrl}/${id}`, payload);
  }

  cambiarEstado(id: string, estado: EstadoPublicacion): Observable<MiPropiedad> {
    return this.http.patch<MiPropiedad>(`${this.baseUrl}/${id}/estado`, { estado });
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  addFoto(propertyId: string, cloudinaryPublicId: string, orden: number): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${propertyId}/fotos`, { cloudinaryPublicId, orden });
  }

  removeFoto(fotoId: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/fotos/${fotoId}`);
  }
}
