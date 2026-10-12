import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { mensajeDeErrorHttp } from '../../../core/http-error.util';
import { SeoService } from '../../../core/seo.service';

@Component({
  selector: 'app-recuperar',
  imports: [FormsModule, RouterLink],
  templateUrl: './recuperar.component.html',
  styleUrl: '../cuenta.scss',
})
export class RecuperarComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly seo = inject(SeoService);

  protected email = '';
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Recuperar contraseña',
      description: 'Restablece la contraseña de tu cuenta de anunciante en Habbi.',
      path: '/cuenta/recuperar',
    });
  }

  protected enviar(form: NgForm): void {
    if (form.invalid) {
      this.error.set('Escribe el correo de tu cuenta.');
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    this.auth.recuperarPassword(this.email.trim()).subscribe({
      next: () => this.enviado.set(true),
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.error.set(
          err.status === 429
            ? 'Pediste demasiados correos. Espera unos minutos y vuelve a intentar.'
            : mensajeDeErrorHttp(err, 'enviar el correo'),
        );
      },
    });
  }
}
