import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../core/properties.service';
import { CatalogFilters, Comuna, Property, TipoOperacion, TipoPropiedad } from '../../core/property.model';
import { PropertyCardComponent } from './property-card.component';
import { HeroCarouselComponent } from './hero-carousel.component';

@Component({
  selector: 'app-catalog',
  imports: [PropertyCardComponent, HeroCarouselComponent, FormsModule],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private readonly properties = inject(PropertiesService);

  readonly items = signal<Property[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly comunas = signal<Pick<Comuna, 'id' | 'nombre' | 'regionId'>[]>([]);

  comunaId = '';
  tipoOperacion: TipoOperacion | '' = '';
  tipoPropiedad: TipoPropiedad | '' = '';

  ngOnInit(): void {
    this.load();
    this.properties.findComunasConPropiedades().subscribe({
      next: (comunas) => this.comunas.set(comunas),
      // Si falla, el filtro de comuna simplemente no aparece — no bloquea el resto del catálogo.
      error: () => this.comunas.set([]),
    });
  }

  buscar(): void {
    this.load();
  }

  private load(): void {
    const filters: CatalogFilters = {
      comunaId: this.comunaId || undefined,
      tipoOperacion: this.tipoOperacion || undefined,
      tipoPropiedad: this.tipoPropiedad || undefined,
    };

    this.loading.set(true);
    this.error.set(false);
    this.properties.findPublished(filters).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}
