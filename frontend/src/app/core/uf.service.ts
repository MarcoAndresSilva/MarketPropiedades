import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Valor de la UF del día (lo da el backend desde mindicador.cl, con respaldo). Se pide
 * una sola vez por visita y lo comparten todas las cards y fichas, para mostrar el precio
 * equivalente ("≈ $352.950.981" o "≈ UF 6.821"). Mientras no llega, o si falla, el
 * equivalente simplemente no se muestra: el precio publicado siempre está.
 */
@Injectable({ providedIn: 'root' })
export class UfService {
  private readonly http = inject(HttpClient);
  private readonly _valor = signal<number | null>(null);

  readonly valor = this._valor.asReadonly();

  constructor() {
    this.http.get<{ valor: number }>(`${environment.apiUrl}/indicadores/uf`).subscribe({
      next: (res) => this._valor.set(res.valor),
      error: () => this._valor.set(null),
    });
  }
}
