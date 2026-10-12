import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { SeoService } from '../../../core/seo.service';

type Estado = 'verificando' | 'ok' | 'invalido';

// Destino del link del correo de verificación (PlantillasCorreo en el backend). Corre solo
// en el navegador (RenderMode.Client): el token es de un solo uso, y si el servidor lo
// consumiera al renderizar, la hidratación lo mandaría de nuevo y vería "link vencido".
@Component({
  selector: 'app-verificar',
  imports: [RouterLink],
  templateUrl: './verificar.component.html',
  styleUrl: '../cuenta.scss',
})
export class VerificarComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  protected readonly auth = inject(AuthService);

  protected readonly estado = signal<Estado>('verificando');

  ngOnInit(): void {
    this.seo.setPage({ title: 'Confirmar correo', description: 'Confirma tu correo en Habbi.', path: '/cuenta/verificar' });

    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.estado.set('invalido');
      return;
    }
    this.auth.verificarEmail(token).subscribe({
      next: () => this.estado.set('ok'),
      error: () => this.estado.set('invalido'),
    });
  }
}
