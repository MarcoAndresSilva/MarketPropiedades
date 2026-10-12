import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { mensajeDeErrorHttp } from '../../../core/http-error.util';
import { SeoService } from '../../../core/seo.service';

// Destino del link del correo de recuperación. Solo en el navegador (RenderMode.Client),
// igual que /cuenta/verificar: el token del link no tiene nada que hacer en el servidor.
@Component({
  selector: 'app-restablecer',
  imports: [FormsModule, RouterLink],
  templateUrl: './restablecer.component.html',
  styleUrl: '../cuenta.scss',
})
export class RestablecerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly seo = inject(SeoService);

  protected readonly token = this.route.snapshot.queryParamMap.get('token');
  protected password = '';
  protected repetir = '';
  protected readonly enviando = signal(false);
  protected readonly listo = signal(false);
  protected readonly linkInvalido = signal(!this.token);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Nueva contraseña',
      description: 'Crea una contraseña nueva para tu cuenta de Habbi.',
      path: '/cuenta/restablecer',
    });
  }

  protected guardar(form: NgForm): void {
    if (form.invalid) {
      this.error.set('La contraseña necesita al menos 8 caracteres.');
      return;
    }
    if (this.password !== this.repetir) {
      this.error.set('Las dos contraseñas no coinciden.');
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    this.auth.restablecerPassword(this.token!, this.password).subscribe({
      next: () => this.listo.set(true),
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        // 400 con token válido en forma = usado o vencido (TokensCuentaService.consumir).
        if (err.status === 400 && typeof err.error?.message === 'string') {
          this.linkInvalido.set(true);
        } else {
          this.error.set(mensajeDeErrorHttp(err, 'cambiar la contraseña'));
        }
      },
    });
  }
}
