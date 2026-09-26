import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PropertiesService } from '../../core/properties.service';
import { CatalogFilters, Comuna, Property, TipoOperacion, TipoPropiedad } from '../../core/property.model';
import { PropertyCardComponent } from './property-card.component';
import { PropertyCardSkeletonComponent } from './property-card-skeleton.component';
import { SeoService } from '../../core/seo.service';
import { RevealOnScrollDirective } from '../../core/reveal-on-scroll.directive';

@Component({
  selector: 'app-catalog',
  imports: [PropertyCardComponent, PropertyCardSkeletonComponent, FormsModule, RevealOnScrollDirective],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private readonly properties = inject(PropertiesService);
  private readonly seo = inject(SeoService);
  private readonly route = inject(ActivatedRoute);

  readonly items = signal<Property[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly comunas = signal<Pick<Comuna, 'id' | 'nombre' | 'regionId'>[]>([]);

  comunaId = '';
  tipoOperacion: TipoOperacion | '' = '';
  tipoPropiedad: TipoPropiedad | '' = '';
  precioMin?: number;
  precioMax?: number;

  ngOnInit(): void {
    // /comprar y /arrendar llegan con la operación ya fijada desde la ruta, y el
    // buscador de la home manda el resto de los filtros como query params.
    this.tipoOperacion = this.route.snapshot.data['tipoOperacion'] ?? '';
    const q = this.route.snapshot.queryParamMap;
    this.comunaId = q.get('comuna') ?? '';
    this.tipoPropiedad = (q.get('tipo') as TipoPropiedad | null) ?? '';
    this.precioMin = Number(q.get('precioMin')) || undefined;
    this.precioMax = Number(q.get('precioMax')) || undefined;
    const titulos: Record<string, string> = {
      VENTA: 'Propiedades en venta en Melipilla y alrededores',
      ARRIENDO: 'Propiedades en arriendo en Melipilla y alrededores',
    };
    this.seo.setPage({
      title: titulos[this.tipoOperacion] ?? 'Propiedades en venta y arriendo en Melipilla',
      description:
        'Casas, departamentos, parcelas y locales en Melipilla y alrededores. Contacta directo por WhatsApp al dueño o la corredora, sin intermediarios.',
      path: `/${this.route.snapshot.routeConfig?.path ?? 'propiedades'}`,
    });

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
      precioMin: this.precioMin,
      precioMax: this.precioMax,
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
