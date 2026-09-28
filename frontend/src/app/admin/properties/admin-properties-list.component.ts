import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminNavComponent } from '../shared/admin-nav.component';
import { AdminMetricasService, MetricasPropiedad } from '../shared/admin-metricas.service';
import { RouterLink } from '@angular/router';
import { AdminPropertiesService } from '../shared/admin-properties.service';
import { Property } from '../../core/property.model';
import { formatPrecio, formatTipoPropiedad } from '../../core/format.util';

@Component({
  selector: 'app-admin-properties-list',
  imports: [RouterLink, AdminNavComponent],
  templateUrl: './admin-properties-list.component.html',
  styleUrl: './admin-properties-list.component.scss',
})
export class AdminPropertiesListComponent implements OnInit {
  private readonly properties = inject(AdminPropertiesService);
  private readonly metricasService = inject(AdminMetricasService);

  readonly items = signal<Property[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly metricas = signal(new Map<string, MetricasPropiedad>());

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

  eliminar(property: Property): void {
    if (!confirm(`¿Eliminar "${property.titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.properties.remove(property.id).subscribe(() => this.load());
  }
}
