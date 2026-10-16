import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth.service';
import { ETIQUETA_ROL } from '../../../core/format.util';
import { IconComponent } from '../../../core/icon.component';
import { SeoService } from '../../../core/seo.service';
import { MisPropiedadesComponent } from '../mis-propiedades/mis-propiedades.component';

type EstadoReenvio = 'listo' | 'enviando' | 'enviado' | 'limite' | 'error';

const MENSAJE_REENVIO: Record<EstadoReenvio, string> = {
  listo: '',
  enviando: '',
  enviado: 'Te enviamos un correo nuevo. Revisa también la carpeta de spam.',
  limite: 'Ya enviamos varios correos. Espera unos minutos antes de pedir otro.',
  error: 'No pudimos enviarlo. Intenta de nuevo en un momento.',
};

// Inicio del anunciante. Detrás de anuncianteGuard, que ya cargó el usuario con /auth/me:
// por eso `user()` se lee directo sin pedirlo de nuevo.
@Component({
  selector: 'app-mi-cuenta',
  imports: [IconComponent, MisPropiedadesComponent],
  templateUrl: './mi-cuenta.component.html',
  styleUrl: './mi-cuenta.component.scss',
})
export class MiCuentaComponent implements OnInit {
  private readonly seo = inject(SeoService);
  protected readonly auth = inject(AuthService);

  protected readonly user = this.auth.currentUser;
  protected readonly nombreRol = computed(() => {
    const user = this.user();
    return user ? ETIQUETA_ROL[user.role] : '';
  });
  protected readonly reenvio = signal<EstadoReenvio>('listo');
  protected readonly mensajeReenvio = computed(() => MENSAJE_REENVIO[this.reenvio()]);

  ngOnInit(): void {
    this.seo.setPage({ title: 'Mi cuenta', description: 'Tu panel de anunciante en Habbi.', path: '/mi-cuenta' });
  }

  protected reenviar(): void {
    this.reenvio.set('enviando');
    this.auth.reenviarVerificacion().subscribe({
      next: () => this.reenvio.set('enviado'),
      // 3 envíos cada 10 minutos por IP (AuthController): cada uno es un correo real.
      error: (err: HttpErrorResponse) => this.reenvio.set(err.status === 429 ? 'limite' : 'error'),
    });
  }
}
