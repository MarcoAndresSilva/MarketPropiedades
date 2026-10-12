import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MiPropiedad, MisPropiedadesService } from './mis-propiedades.service';
import { ACCIONES_ANUNCIANTE, AccionEstado, ESTADO_PUBLICACION } from '../../../core/estado-publicacion';
import { cloudinaryImageUrl } from '../../../core/cloudinary.util';
import { formatPrecio, formatTipoPropiedad } from '../../../core/format.util';
import { mensajeDeErrorHttp } from '../../../core/http-error.util';

// Lista de propiedades del anunciante en /mi-cuenta, con su estado de moderación y los
// cambios de estado que puede pedir. Solo se muestra con el correo verificado: la API
// rechaza todo /mis-propiedades sin verificar.
@Component({
  selector: 'app-mis-propiedades',
  imports: [RouterLink],
  templateUrl: './mis-propiedades.component.html',
  styleUrl: './mis-propiedades.component.scss',
})
export class MisPropiedadesComponent implements OnInit {
  private readonly misPropiedades = inject(MisPropiedadesService);

  protected readonly items = signal<MiPropiedad[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  /** Id de la propiedad con una acción en curso, para deshabilitar solo sus botones. */
  protected readonly ocupada = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly estado = ESTADO_PUBLICACION;
  protected readonly acciones = ACCIONES_ANUNCIANTE;
  protected readonly cloudinaryImageUrl = cloudinaryImageUrl;
  protected readonly formatPrecio = formatPrecio;
  protected readonly formatTipoPropiedad = formatTipoPropiedad;

  ngOnInit(): void {
    this.misPropiedades.findAll().subscribe({
      next: (items) => {
        this.items.set(items);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.errorCarga.set(true);
      },
    });
  }

  protected cambiarEstado(propiedad: MiPropiedad, accion: AccionEstado): void {
    if (accion.confirmar && !confirm(accion.confirmar)) return;
    this.ocupada.set(propiedad.id);
    this.error.set(null);

    this.misPropiedades.cambiarEstado(propiedad.id, accion.hacia).subscribe({
      next: (actualizada) => {
        this.items.update((items) => items.map((p) => (p.id === actualizada.id ? actualizada : p)));
        this.ocupada.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.ocupada.set(null);
        this.error.set(mensajeDeErrorHttp(err, 'cambiar el estado'));
      },
    });
  }

  protected eliminar(propiedad: MiPropiedad): void {
    if (!confirm(`¿Eliminar "${propiedad.titulo}"? Esta acción no se puede deshacer.`)) return;
    this.ocupada.set(propiedad.id);
    this.error.set(null);

    this.misPropiedades.remove(propiedad.id).subscribe({
      next: () => {
        this.items.update((items) => items.filter((p) => p.id !== propiedad.id));
        this.ocupada.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.ocupada.set(null);
        this.error.set(mensajeDeErrorHttp(err, 'eliminar'));
      },
    });
  }
}
