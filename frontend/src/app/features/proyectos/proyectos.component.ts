import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ProyectosService } from '../../core/proyectos.service';
import { ETAPA_LABEL, EtapaProyecto, Proyecto } from '../../core/proyecto.model';
import { PropertiesService } from '../../core/properties.service';
import { Comuna } from '../../core/property.model';
import { SeoService } from '../../core/seo.service';
import { IconComponent } from '../../core/icon.component';
import { BUSINESS_WHATSAPP } from '../../core/business-contact';
import { buildWhatsappUrl } from '../../core/whatsapp.util';
import { PropertyCardSkeletonComponent } from '../catalog/property-card-skeleton.component';
import { ProyectoCardComponent } from './proyecto-card.component';

// Proyectos que corredoras e inmobiliarias desarrollan en la zona. Mismo patrón que el
// listado de propiedades: los filtros viven en la URL (?comuna=&etapa=).
@Component({
  selector: 'app-proyectos',
  imports: [FormsModule, IconComponent, PropertyCardSkeletonComponent, ProyectoCardComponent],
  templateUrl: './proyectos.component.html',
  styleUrl: './proyectos.component.scss',
})
export class ProyectosComponent implements OnInit {
  private readonly proyectos = inject(ProyectosService);
  private readonly properties = inject(PropertiesService);
  private readonly seo = inject(SeoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly etapas = (Object.keys(ETAPA_LABEL) as EtapaProyecto[]).map((value) => ({ value, label: ETAPA_LABEL[value] }));
  protected readonly items = signal<Proyecto[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly comunas = signal<Pick<Comuna, 'id' | 'nombre'>[]>([]);
  protected readonly comunaId = signal('');
  protected readonly etapa = signal('');
  protected readonly hayFiltros = signal(false);

  protected readonly contactoUrl = buildWhatsappUrl(
    BUSINESS_WHATSAPP,
    'Hola, desarrollo un proyecto inmobiliario y me gustaría publicarlo en Habbi.',
  );

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Proyectos inmobiliarios en Melipilla y alrededores',
      description: 'Condominios, edificios y loteos en desarrollo en Melipilla y alrededores, con precios desde y etapa de obra.',
      path: '/proyectos',
    });

    // El selector de comunas del catálogo de propiedades sirve también acá.
    this.properties.findComunasConPropiedades().subscribe({
      next: (c) => this.comunas.set(c),
      error: () => this.comunas.set([]),
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((q) => {
      this.comunaId.set(q.get('comuna') ?? '');
      this.etapa.set(q.get('etapa') ?? '');
      this.hayFiltros.set(!!(this.comunaId() || this.etapa()));
      this.loading.set(true);
      this.proyectos
        .findPublished({ comunaId: this.comunaId() || undefined, etapa: (this.etapa() || undefined) as EtapaProyecto | undefined })
        .subscribe({
          next: (res) => {
            this.items.set(res.items);
            this.total.set(res.total);
            this.loading.set(false);
          },
          error: () => {
            this.items.set([]);
            this.loading.set(false);
          },
        });
    });
  }

  protected cambiar(cambios: Params): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: cambios, queryParamsHandling: 'merge' });
  }
}
