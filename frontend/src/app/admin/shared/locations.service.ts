import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comuna } from '../../core/property.model';

@Injectable({ providedIn: 'root' })
export class LocationsService {
  private readonly http = inject(HttpClient);

  findAll(): Observable<Comuna[]> {
    return this.http.get<Comuna[]>(`${environment.apiUrl}/comunas`);
  }
}
