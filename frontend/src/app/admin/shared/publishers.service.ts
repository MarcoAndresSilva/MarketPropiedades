import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Publisher {
  id: string;
  email: string;
  name: string;
  whatsapp: string | null;
  role: 'PERSONA' | 'CORREDORA';
  corredoraProfile: { razonSocial: string; rut: string } | null;
}

@Injectable({ providedIn: 'root' })
export class PublishersService {
  private readonly http = inject(HttpClient);

  findAll(): Observable<Publisher[]> {
    return this.http.get<Publisher[]>(`${environment.apiUrl}/users`);
  }
}
