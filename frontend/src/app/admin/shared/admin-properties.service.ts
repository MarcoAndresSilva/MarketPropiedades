import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Property } from '../../core/property.model';

export type CreatePropertyPayload = Omit<
  Property,
  'id' | 'slug' | 'comuna' | 'fotos' | 'publicador' | 'createdAt' | 'updatedAt' | 'precioUf'
> & { publicadorId: string; precioUf: number | null };

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

@Injectable({ providedIn: 'root' })
export class AdminPropertiesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/properties`;

  findAll(): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.baseUrl}/admin/all`);
  }

  findOne(id: string): Observable<Property> {
    return this.http.get<Property>(`${this.baseUrl}/admin/${id}`);
  }

  create(payload: CreatePropertyPayload): Observable<Property> {
    return this.http.post<Property>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdatePropertyPayload): Observable<Property> {
    return this.http.patch<Property>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<{ ok: true }> {
    return this.http.delete<{ ok: true }>(`${this.baseUrl}/${id}`);
  }

  addFoto(propertyId: string, cloudinaryPublicId: string, orden: number): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${propertyId}/fotos`, { cloudinaryPublicId, orden });
  }

  removeFoto(fotoId: string): Observable<{ ok: true }> {
    return this.http.delete<{ ok: true }>(`${this.baseUrl}/fotos/${fotoId}`);
  }

  getUploadSignature(): Observable<UploadSignature> {
    return this.http.post<UploadSignature>(`${environment.apiUrl}/uploads/signature`, {});
  }
}
