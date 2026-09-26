import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PropertiesService } from '../../core/properties.service';
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
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly properties = inject(PropertiesService);
  private readonly seo = inject(SeoService);

  protected readonly destacadas = signal<Property[]>([]);
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

    // El backend ya ordena destacadas primero; las 4 primeras publicadas son la sección.
    this.properties.findPublished({ pageSize: 4 }).subscribe({
      next: (res) => {
        this.destacadas.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
