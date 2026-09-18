import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CatalogFilters, Comuna, PaginatedProperties, Property } from './property.model';

@Injectable({ providedIn: 'root' })
export class PropertiesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/properties`;

  findPublished(filters: CatalogFilters): Observable<PaginatedProperties> {
    let params = new HttpParams();
    if (filters.comunaId) params = params.set('comunaId', filters.comunaId);
    if (filters.tipoOperacion) params = params.set('tipoOperacion', filters.tipoOperacion);
    if (filters.tipoPropiedad) params = params.set('tipoPropiedad', filters.tipoPropiedad);
    if (filters.dormitoriosMin) params = params.set('dormitoriosMin', filters.dormitoriosMin);
    if (filters.page) params = params.set('page', filters.page);

    return this.http.get<PaginatedProperties>(this.baseUrl, { params });
  }

  findBySlug(slug: string): Observable<Property> {
    return this.http.get<Property>(`${this.baseUrl}/${slug}`);
  }

  findComunasConPropiedades(): Observable<Pick<Comuna, 'id' | 'nombre' | 'regionId'>[]> {
    return this.http.get<Pick<Comuna, 'id' | 'nombre' | 'regionId'>[]>(`${this.baseUrl}/comunas`);
  }
}
