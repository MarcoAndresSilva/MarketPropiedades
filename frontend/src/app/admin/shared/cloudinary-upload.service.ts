import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export interface CloudinaryUpload {
  public_id: string;
  secure_url: string;
}

// Subida directa del navegador a Cloudinary con la firma que da el backend (el binario
// nunca pasa por nuestra API, ver Fase 6). La usan los formularios de propiedades y de
// proyectos. HttpClient plano: la URL de Cloudinary no empieza con environment.apiUrl,
// así que el interceptor de auth no le agrega el token.
@Injectable({ providedIn: 'root' })
export class CloudinaryUploadService {
  private readonly http = inject(HttpClient);

  subir(file: File): Observable<CloudinaryUpload> {
    return this.http.post<UploadSignature>(`${environment.apiUrl}/uploads/signature`, {}).pipe(
      switchMap((sig) => {
        const form = new FormData();
        form.append('file', file);
        form.append('api_key', sig.apiKey);
        form.append('timestamp', String(sig.timestamp));
        form.append('signature', sig.signature);
        form.append('folder', sig.folder);
        return this.http.post<CloudinaryUpload>(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, form);
      }),
    );
  }
}
