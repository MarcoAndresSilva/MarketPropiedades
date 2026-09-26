import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { PropertiesService } from '../../core/properties.service';
import { CatalogFilters, Comuna, Property, TipoOperacion, TipoPropiedad } from '../../core/property.model';
import { PropertyCardComponent } from './property-card.component';
import { PropertyCardSkeletonComponent } from './property-card-skeleton.component';
import { SeoService } from '../../core/seo.service';
import { IconComponent } from '../../core/icon.component';
import { RevealOnScrollDirective } from '../../core/reveal-on-scroll.directive';
import { Orden, RANGOS_PRECIO, TIPOS_PROPIEDAD, indiceRango } from '../../core/search-options';

const PAGE_SIZE = 12;

const TEXTOS: Record<TipoOperacion | 'TODAS', { eyebrow: string; titulo: string; bajada: string }> = {
  VENTA: {
    eyebrow: 'Comprar',
    titulo: 'Propiedades en venta',
    bajada: 'Casas, parcelas, departamentos y locales en venta en Melipilla y alrededores. Precios en UF.',
  },
  ARRIENDO: {
    eyebrow: 'Arrendar',
    titulo: 'Propiedades en arriendo',
    bajada: 'Casas, departamentos, oficinas y bodegas en arriendo en Melipilla y alrededores. Precios mensuales en pesos.',
  },
  TODAS: {
    eyebrow: 'Propiedades',
    titulo: 'Todas las propiedades',
    bajada: 'Venta y arriendo en Melipilla y alrededores, con contacto directo por WhatsApp.',
  },
};

// Página de listado: /comprar y /arrendar (operación fija desde la ruta) y /propiedades
// (operación elegible). Los filtros viven en la URL: cambiar uno navega con los query
// params nuevos y la lista se recarga desde ahí, así "atrás" y los links compartidos
// siempre muestran lo mismo que se ve en pantalla.
@Component({
  selector: 'app-catalog',
  imports: [FormsModule, RouterLink, PropertyCardComponent, PropertyCardSkeletonComponent, IconComponent, RevealOnScrollDirective],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private readonly properties = inject(PropertiesService);
  private readonly seo = inject(SeoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tipos = TIPOS_PROPIEDAD;
  protected readonly dormitoriosOpciones = [1, 2, 3, 4];

  /** Operación fijada por la ruta (/comprar, /arrendar); null en /propiedades. */
  protected readonly operacionFija: TipoOperacion | null = this.route.snapshot.data['tipoOperacion'] ?? null;

  protected readonly items = signal<Property[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly error = signal(false);
  protected readonly comunas = signal<Pick<Comuna, 'id' | 'nombre'>[]>([]);
  protected readonly filtros = signal<CatalogFilters>({});
  private page = 1;

  protected readonly operacion = computed(() => this.operacionFija ?? this.filtros().tipoOperacion ?? null);
  protected readonly rangos = computed(() => {
    const op = this.operacion();
    return op ? RANGOS_PRECIO[op] : [];
  });
  protected readonly textos = computed(() => TEXTOS[this.operacionFija ?? 'TODAS']);
  protected readonly hayMas = computed(() => this.items().length < this.total());
  protected readonly hayFiltros = computed(() => {
    const f = this.filtros();
    return !!(f.comunaId || f.tipoPropiedad || f.precioMin || f.precioMax || f.dormitoriosMin || (!this.operacionFija && f.tipoOperacion));
  });

  // Valores de los <select>, derivados de la URL.
  protected readonly rangoSeleccionado = computed(() => {
    const op = this.operacion();
    const f = this.filtros();
    return op ? indiceRango(op, f.precioMin, f.precioMax) : '';
  });

  ngOnInit(): void {
    const textos = this.textos();
    this.seo.setPage({
      title: `${textos.titulo} en Melipilla y alrededores`,
      description: textos.bajada,
      path: `/${this.route.snapshot.routeConfig?.path ?? 'propiedades'}`,
    });

    this.properties.findComunasConPropiedades().subscribe({
      next: (comunas) => this.comunas.set(comunas),
      error: () => this.comunas.set([]),
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((q) => {
      const numero = (clave: string) => Number(q.get(clave)) || undefined;
      this.filtros.set({
        tipoOperacion: this.operacionFija ?? ((q.get('operacion') as TipoOperacion | null) || undefined),
        comunaId: q.get('comuna') || undefined,
        tipoPropiedad: (q.get('tipo') as TipoPropiedad | null) || undefined,
        precioMin: numero('precioMin'),
        precioMax: numero('precioMax'),
        dormitoriosMin: numero('dormitorios'),
        orden: (q.get('orden') as Orden | null) || 'recientes',
      });
      this.cargar();
    });
  }

  /** Cambia un filtro navegando: la suscripción a los query params hace la carga. */
  protected cambiar(cambios: Params): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: cambios, queryParamsHandling: 'merge' });
  }

  protected cambiarOperacion(valor: string): void {
    // El rango y el orden por precio dependen de la unidad (UF o CLP): se limpian.
    this.cambiar({ operacion: valor || null, precioMin: null, precioMax: null, orden: null });
  }

  protected cambiarRango(indice: string): void {
    const rango = indice === '' ? undefined : this.rangos()[Number(indice)];
    this.cambiar({ precioMin: rango?.min ?? null, precioMax: rango?.max ?? null });
  }

  protected limpiar(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected verMas(): void {
    this.page += 1;
    this.loadingMore.set(true);
    this.properties.findPublished({ ...this.filtros(), page: this.page, pageSize: PAGE_SIZE }).subscribe({
      next: (res) => {
        this.items.update((actual) => [...actual, ...res.items]);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  private cargar(): void {
    this.page = 1;
    this.loading.set(true);
    this.error.set(false);
    this.properties.findPublished({ ...this.filtros(), page: 1, pageSize: PAGE_SIZE }).subscribe({
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
