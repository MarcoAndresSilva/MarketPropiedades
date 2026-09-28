import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { PropertiesService } from '../../core/properties.service';
import { ProyectosService } from '../../core/proyectos.service';
import { Proyecto } from '../../core/proyecto.model';
import { Property } from '../../core/property.model';
import { SeoService } from '../../core/seo.service';
import { IconComponent, IconName } from '../../core/icon.component';
import { RevealOnScrollDirective } from '../../core/reveal-on-scroll.directive';
import { BRAND_NAME } from '../../core/brand';
import { environment } from '../../../environments/environment';
import { PropertyCardComponent } from '../catalog/property-card.component';
import { PropertyCardSkeletonComponent } from '../catalog/property-card-skeleton.component';
import { SearchBoxComponent } from './search-box.component';
import { MarketingVisualComponent } from './marketing-visual.component';
import { ProyectoCardComponent } from '../proyectos/proyecto-card.component';

// Home del render de marca de Habbi: hero con buscador, destacadas, beneficios,
// marketing y CTA. Todos los textos describen cosas que el servicio hace hoy — el
// render traía cifras ("12.4K visualizaciones") y afirmaciones ("propiedades en todo
// Chile", "usuarios verificados") que no son ciertas todavía, y se reemplazaron.
@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    IconComponent,
    RevealOnScrollDirective,
    PropertyCardComponent,
    PropertyCardSkeletonComponent,
    SearchBoxComponent,
    MarketingVisualComponent,
    ProyectoCardComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly properties = inject(PropertiesService);
  private readonly proyectosService = inject(ProyectosService);
  private readonly seo = inject(SeoService);

  protected readonly destacadas = signal<Property[]>([]);
  protected readonly proyectoDestacado = signal<Proyecto | null>(null);
  protected readonly loading = signal(true);

  protected readonly beneficios: { icono: IconName; titulo: string; texto: string }[] = [
    { icono: 'house', titulo: 'Gran variedad', texto: 'Casas, parcelas y más en Melipilla y alrededores' },
    { icono: 'chart-column-increasing', titulo: 'Marketing inmobiliario', texto: 'Potencia tu propiedad con contenido y Meta Ads' },
    { icono: 'shield-check', titulo: 'Publicación segura', texto: 'Cada ficha revisada por nuestro equipo' },
    { icono: 'users', titulo: 'Asesoría y soporte', texto: 'Te acompañamos en todo el proceso' },
  ];

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Propiedades en venta y arriendo en Melipilla',
      description:
        'Casas, departamentos, parcelas y locales en Melipilla y alrededores. Contacta directo por WhatsApp al dueño o la corredora, y potencia tu propiedad con marketing digital.',
      path: '/',
    });
    this.seo.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', name: BRAND_NAME, url: environment.siteUrl },
        { '@type': 'WebSite', name: BRAND_NAME, url: environment.siteUrl },
      ],
    });

    // Como en el render: 4 cards, la última un proyecto destacado si hay alguno. El
    // backend ya ordena las propiedades destacadas primero. Si falla la parte de
    // proyectos, la sección igual muestra las 4 propiedades.
    forkJoin({
      propiedades: this.properties.findPublished({ pageSize: 4 }),
      proyectos: this.proyectosService.findPublished({ destacado: true, pageSize: 1 }).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ propiedades, proyectos }) => {
        const proyecto = proyectos?.items[0] ?? null;
        this.proyectoDestacado.set(proyecto);
        this.destacadas.set(propiedades.items.slice(0, proyecto ? 3 : 4));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
