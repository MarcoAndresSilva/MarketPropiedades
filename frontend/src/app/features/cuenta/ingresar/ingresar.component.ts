import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, inicioSegunRol } from '../../../core/auth.service';
import { mensajeDeErrorHttp } from '../../../core/http-error.util';
import { SeoService } from '../../../core/seo.service';

@Component({
  selector: 'app-ingresar',
  imports: [FormsModule, RouterLink],
  templateUrl: './ingresar.component.html',
  styleUrl: '../cuenta.scss',
})
export class IngresarComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);

  protected email = '';
  protected password = '';
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Ingresar',
      description: 'Entra a tu cuenta de anunciante en Habbi para administrar tus propiedades.',
      path: '/ingresar',
    });
  }

  protected entrar(form: NgForm): void {
    if (form.invalid) {
      this.error.set('Escribe tu correo y tu contraseña.');
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    this.auth.login(this.email, this.password).subscribe({
      next: (user) => this.router.navigateByUrl(inicioSegunRol(user)),
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.error.set(mensajeDeLogin(err));
      },
    });
  }
}

/** El backend responde lo mismo si el correo no existe o si la clave está mal (no revela cuentas). */
function mensajeDeLogin(err: HttpErrorResponse): string {
  if (err.status === 401) return 'Correo o contraseña incorrectos.';
  if (err.status === 429) return 'Demasiados intentos. Espera un minuto y vuelve a intentar.';
  return mensajeDeErrorHttp(err, 'entrar');
}
