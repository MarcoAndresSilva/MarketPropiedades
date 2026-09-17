import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PropertiesService } from '../../core/properties.service';
import { Property } from '../../core/property.model';
import { formatPrecio, formatTipoPropiedad } from '../../core/format.util';
import { buildWhatsappUrl } from '../../core/whatsapp.util';
import { PhotoSliderComponent } from './photo-slider.component';

@Component({
  selector: 'app-property-detail',
  imports: [RouterLink, DecimalPipe, PhotoSliderComponent],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss',
})
export class PropertyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly properties = inject(PropertiesService);

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
      next: (property) => this.property.set(property),
      error: () => this.notFound.set(true),
    });
  }

  whatsappContactoUrl(property: Property): string {
    const texto = `Hola, me interesa la propiedad "${this.formatTipoPropiedad(property.tipoPropiedad)} en ${property.comuna.nombre}" que vi en Market Propiedades.`;
    return buildWhatsappUrl(property.publicador.whatsapp ?? '', texto);
  }

  whatsappAgendarUrl(property: Property): string {
    const texto = `Hola, quiero agendar una visita a la propiedad "${this.formatTipoPropiedad(property.tipoPropiedad)} en ${property.comuna.nombre}" que vi en Market Propiedades.`;
    return buildWhatsappUrl(property.publicador.whatsapp ?? '', texto);
  }
}
