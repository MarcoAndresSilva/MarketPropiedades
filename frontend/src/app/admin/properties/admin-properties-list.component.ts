import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminPropertiesService } from '../shared/admin-properties.service';
import { Property } from '../../core/property.model';
import { formatPrecio, formatTipoPropiedad } from '../../core/format.util';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin-properties-list',
  imports: [RouterLink],
  templateUrl: './admin-properties-list.component.html',
  styleUrl: './admin-properties-list.component.scss',
})
export class AdminPropertiesListComponent implements OnInit {
  private readonly properties = inject(AdminPropertiesService);
  protected readonly auth = inject(AuthService);

  readonly items = signal<Property[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly formatPrecio = formatPrecio;
  readonly formatTipoPropiedad = formatTipoPropiedad;

  ngOnInit(): void {
    this.auth.loadCurrentUser().subscribe();
    this.load();
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
    if (!confirm(`¿Eliminar "${this.formatTipoPropiedad(property.tipoPropiedad)} en ${property.comuna.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.properties.remove(property.id).subscribe(() => this.load());
  }
}
