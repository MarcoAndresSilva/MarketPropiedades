import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegistroData } from '../../../core/auth.service';
import { IconComponent, IconName } from '../../../core/icon.component';
import { mensajeDeErrorHttp } from '../../../core/http-error.util';
import { SeoService } from '../../../core/seo.service';
import { normalizarWhatsapp } from '../../../core/whatsapp.util';

type TipoCuenta = RegistroData['role'];

interface OpcionTipo {
  rol: TipoCuenta;
  titulo: string;
  detalle: string;
  icono: IconName;
  etiquetaNombre: string;
}

// "Propietario" en pantalla es PERSONA en la base: el rol nació antes del registro
// público (Fase 3) y para quien se registra la palabra natural es otra.
const TIPOS: OpcionTipo[] = [
  {
    rol: 'PERSONA',
    titulo: 'Propietario',
    detalle: 'Publicas tu casa, parcela o local.',
    icono: 'house',
    etiquetaNombre: 'Tu nombre',
  },
  {
    rol: 'CORREDORA',
    titulo: 'Corredora',
    detalle: 'Publicas propiedades de tus clientes.',
    icono: 'users',
    etiquetaNombre: 'Nombre de la corredora',
  },
  {
    rol: 'INMOBILIARIA',
    titulo: 'Inmobiliaria',
    detalle: 'Desarrollas proyectos en la zona.',
    icono: 'building-2',
    etiquetaNombre: 'Nombre de la inmobiliaria',
  },
];

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink, IconComponent],
  templateUrl: './registro.component.html',
  styleUrl: '../cuenta.scss',
})
export class RegistroComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);

  protected readonly tipos = TIPOS;
  protected readonly rol = signal<TipoCuenta>('PERSONA');
  protected readonly etiquetaNombre = computed(() => TIPOS.find((t) => t.rol === this.rol())!.etiquetaNombre);

  protected name = '';
  protected email = '';
  protected whatsapp = '';
  protected password = '';
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Crea tu cuenta',
      description: 'Publica tus propiedades en Habbi: cuentas para propietarios, corredoras e inmobiliarias de Melipilla y alrededores.',
      path: '/registro',
    });
  }

  protected registrar(form: NgForm): void {
    if (form.invalid) {
      this.error.set('Revisa los campos: todos son obligatorios y la contraseña necesita al menos 8 caracteres.');
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    this.auth
      .registro({
        role: this.rol(),
        name: this.name.trim(),
        email: this.email.trim(),
        whatsapp: normalizarWhatsapp(this.whatsapp),
        password: this.password,
      })
      .subscribe({
        next: () => this.router.navigateByUrl('/mi-cuenta'),
        error: (err: HttpErrorResponse) => {
          this.enviando.set(false);
          this.error.set(
            err.status === 429
              ? 'Se crearon demasiadas cuentas desde esta conexión. Intenta de nuevo en unos minutos.'
              : mensajeDeErrorHttp(err, 'crear la cuenta'),
          );
        },
      });
  }
}
