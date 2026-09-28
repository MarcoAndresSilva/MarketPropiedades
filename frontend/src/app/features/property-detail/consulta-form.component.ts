import { Component, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';
import { ConsultasService } from '../../core/consultas.service';
import { IconComponent } from '../../core/icon.component';

// Formulario de consulta de la ficha: la alternativa a WhatsApp para quien prefiere
// dejar sus datos y que lo contacten. Pide correo o teléfono (al menos uno) y lleva un
// campo trampa oculto contra bots, en vez de un captcha que molesta a las personas.
@Component({
  selector: 'app-consulta-form',
  imports: [FormsModule, IconComponent],
  templateUrl: './consulta-form.component.html',
  styleUrl: './consulta-form.component.scss',
})
export class ConsultaFormComponent {
  private readonly consultas = inject(ConsultasService);

  readonly slug = input.required<string>();

  protected nombre = '';
  protected email = '';
  protected telefono = '';
  protected mensaje = '';
  protected sitioWeb = '';

  protected readonly enviando = signal(false);
  protected readonly enviada = signal(false);
  protected readonly error = signal<string | null>(null);

  protected enviar(form: NgForm): void {
    this.error.set(null);
    if (this.nombre.trim().length < 2 || this.mensaje.trim().length < 10) {
      this.error.set('Escribe tu nombre y un mensaje de al menos 10 caracteres.');
      return;
    }
    if (!this.email.trim() && !this.telefono.trim()) {
      this.error.set('Deja un correo o un teléfono para que puedan responderte.');
      return;
    }
    if (form.controls['email']?.invalid) {
      this.error.set('Revisa el correo: no parece válido.');
      return;
    }

    this.enviando.set(true);
    this.consultas
      .enviar(this.slug(), {
        nombre: this.nombre.trim(),
        email: this.email.trim() || undefined,
        telefono: this.telefono.trim() || undefined,
        mensaje: this.mensaje.trim(),
        sitioWeb: this.sitioWeb || undefined,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.enviada.set(true);
        },
        error: (err: HttpErrorResponse) => {
          this.enviando.set(false);
          this.error.set(
            err.status === 429
              ? 'Enviaste varias consultas seguidas. Espera unos minutos e inténtalo de nuevo.'
              : err.status === 400
                ? 'Revisa los datos: el teléfono debe tener entre 8 y 20 dígitos.'
                : 'No pudimos enviar la consulta. Inténtalo de nuevo o escribe por WhatsApp.',
          );
        },
      });
  }
}
