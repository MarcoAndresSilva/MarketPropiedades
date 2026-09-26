import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PropertiesService } from '../../core/properties.service';
import { Property } from '../../core/property.model';
import { formatPrecio, formatTipoPropiedad, truncarEnPalabra } from '../../core/format.util';
import { buildWhatsappUrl } from '../../core/whatsapp.util';
import { PhotoSliderComponent } from './photo-slider.component';
import { PropertyMapComponent } from './property-map.component';
import { SeoService } from '../../core/seo.service';
import { cloudinaryImageUrl } from '../../core/cloudinary.util';
import { environment } from '../../../environments/environment';
import { BRAND_NAME } from '../../core/brand';

@Component({
  selector: 'app-property-detail',
  imports: [RouterLink, DecimalPipe, PhotoSliderComponent, PropertyMapComponent],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss',
})
export class PropertyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly properties = inject(PropertiesService);
  private readonly seo = inject(SeoService);

  readonly property = signal<Property | null>(null);
  readonly notFound = signal(false);

  readonly formatPrecio = formatPrecio;
  readonly formatTipoPropiedad = formatTipoPropiedad;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.notFound.set(true);
      return;
    }

    this.properties.findBySlug(slug).subscribe({
      next: (property) => {
        this.property.set(property);
        this.setSeo(property);
      },
      error: () => this.notFound.set(true),
    });
  }

  private setSeo(p: Property): void {
    const titulo = p.titulo;
    const precio = this.formatPrecio(p);
    const descripcion = truncarEnPalabra(`${titulo} — ${precio}. ${p.descripcion}`, 157);
    const path = `/propiedad/${p.slug}`;

    let image: string | undefined;
    if (p.fotos.length > 0) {
      const url = cloudinaryImageUrl(p.fotos[0].cloudinaryPublicId, 1200, 630);
      image = url.startsWith('http') ? url : `${environment.siteUrl}${url}`;
    }

    this.seo.setPage({ title: titulo, description: descripcion, path, image });

    this.seo.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: titulo,
      description: p.descripcion,
      url: `${environment.siteUrl}${path}`,
      ...(image ? { image } : {}),
      address: {
        '@type': 'PostalAddress',
        addressLocality: p.comuna.nombre,
        addressRegion: p.comuna.region.nombre,
        addressCountry: 'CL',
      },
      ...(p.lat !== null && p.lng !== null
        ? { geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng } }
        : {}),
    });
  }

  whatsappContactoUrl(property: Property): string {
    const texto = `Hola, me interesa la propiedad "${property.titulo}" que vi en ${BRAND_NAME}.`;
    return buildWhatsappUrl(property.publicador.whatsapp ?? '', texto);
  }

  whatsappAgendarUrl(property: Property): string {
    const texto = `Hola, quiero agendar una visita a la propiedad "${property.titulo}" que vi en ${BRAND_NAME}.`;
    return buildWhatsappUrl(property.publicador.whatsapp ?? '', texto);
  }
}
