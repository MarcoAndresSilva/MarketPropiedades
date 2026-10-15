import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminNavComponent } from '../shared/admin-nav.component';
import { AdminMetricasService, MetricasPropiedad } from '../shared/admin-metricas.service';
import { AdminPropertiesService } from '../shared/admin-properties.service';
import { Property } from '../../core/property.model';
import { ESTADO_PUBLICACION } from '../../core/estado-publicacion';
import { formatPrecio, formatTipoPropiedad } from '../../core/format.util';
import { mensajeDeErrorHttp } from '../../core/http-error.util';

type Filtro = 'todas' | 'revision';

// Mismos límites que RechazarPropertyDto en el backend.
const MOTIVO_MIN = 10;
const MOTIVO_MAX = 500;

@Component({
  selector: 'app-admin-properties-list',
  imports: [RouterLink, FormsModule, AdminNavComponent],
  templateUrl: './admin-properties-list.component.html',
  styleUrl: './admin-properties-list.component.scss',
})
export class AdminPropertiesListComponent implements OnInit {
  private readonly properties = inject(AdminPropertiesService);
  private readonly metricasService = inject(AdminMetricasService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly items = signal<Property[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly metricas = signal(new Map<string, MetricasPropiedad>());

  // La cola de revisión se filtra en el cliente: el listado completo ya está cargado y así
  // el contador de la pestaña sale gratis. El filtro va en la URL (?estado=EN_REVISION)
  // para poder volver a la cola desde el formulario o compartir el link.
  readonly filtro = signal<Filtro>(
    this.route.snapshot.queryParamMap.get('estado') === 'EN_REVISION' ? 'revision' : 'todas',
  );
  readonly enRevision = computed(() => this.items().filter((p) => p.estado === 'EN_REVISION'));
  readonly visibles = computed(() => (this.filtro() === 'revision' ? this.enRevision() : this.items()));

  /** Id de la propiedad con una acción en curso, para deshabilitar solo sus botones. */
  readonly ocupada = signal<string | null>(null);
  readonly accionError = signal<string | null>(null);

  readonly rechazando = signal<Property | null>(null);
  readonly motivoError = signal<string | null>(null);
  motivo = '';
  private readonly dialogoRechazo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogoRechazo');

  readonly estadoPublicacion = ESTADO_PUBLICACION;
  readonly motivoMax = MOTIVO_MAX;
  readonly formatPrecio = formatPrecio;
  readonly formatTipoPropiedad = formatTipoPropiedad;

  ngOnInit(): void {
    this.load();
    // Si las métricas fallan, la tabla igual se muestra (con ceros).
    this.metricasService.porPropiedad().subscribe({
      next: (lista) => this.metricas.set(new Map(lista.map((m) => [m.propertyId, m]))),
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.properties.findAll().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  cambiarFiltro(filtro: Filtro): void {
    this.filtro.set(filtro);
    this.router.navigate([], {
      queryParams: { estado: filtro === 'revision' ? 'EN_REVISION' : null },
      replaceUrl: true,
    });
  }

  aprobar(property: Property): void {
    this.ocupada.set(property.id);
    this.accionError.set(null);
    this.properties.aprobar(property.id).subscribe({
      next: () => {
        this.reemplazar(property.id, { estado: 'PUBLICADA', motivoRechazo: null });
        this.ocupada.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.ocupada.set(null);
        this.accionError.set(mensajeDeErrorHttp(err, 'aprobar'));
      },
    });
  }

  abrirRechazo(property: Property): void {
    this.rechazando.set(property);
    this.motivo = '';
    this.motivoError.set(null);
    this.dialogoRechazo().nativeElement.showModal();
  }

  cerrarRechazo(): void {
    this.dialogoRechazo().nativeElement.close();
    this.rechazando.set(null);
  }

  confirmarRechazo(): void {
    const property = this.rechazando();
    const motivo = this.motivo.trim();
    if (!property) return;
    if (motivo.length < MOTIVO_MIN) {
      this.motivoError.set(`Explica qué corregir en al menos ${MOTIVO_MIN} caracteres: es lo que lee el anunciante.`);
      return;
    }

    this.ocupada.set(property.id);
    this.motivoError.set(null);
    this.properties.rechazar(property.id, motivo).subscribe({
      next: () => {
        this.reemplazar(property.id, { estado: 'RECHAZADA', motivoRechazo: motivo });
        this.ocupada.set(null);
        this.cerrarRechazo();
      },
      error: (err: HttpErrorResponse) => {
        this.ocupada.set(null);
        this.motivoError.set(mensajeDeErrorHttp(err, 'rechazar'));
      },
    });
  }

  eliminar(property: Property): void {
    if (!confirm(`¿Eliminar "${property.titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.properties.remove(property.id).subscribe(() => this.load());
  }

  private reemplazar(id: string, cambios: Pick<Property, 'estado' | 'motivoRechazo'>): void {
    this.items.update((items) => items.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  }
}
