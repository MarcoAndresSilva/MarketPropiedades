import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PropertiesService } from '../../core/properties.service';
import { Property } from '../../core/property.model';
import { formatPrecio, formatPrecioEquivalente, formatTipoPropiedad, formatUbicacion, truncarEnPalabra } from '../../core/format.util';
import { UfService } from '../../core/uf.service';
import { buildWhatsappUrl } from '../../core/whatsapp.util';
import { GaleriaComponent } from './galeria.component';
import { PropertyMapComponent } from './property-map.component';
import { SeoService } from '../../core/seo.service';
import { cloudinaryImageUrl } from '../../core/cloudinary.util';
import { environment } from '../../../environments/environment';
import { BRAND_NAME } from '../../core/brand';
import { IconComponent, IconName } from '../../core/icon.component';
import { FavoritesService } from '../../core/favorites.service';
import { MetricasService } from '../../core/metricas.service';
import { ConsultaFormComponent } from './consulta-form.component';

const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

const ROL_LABEL: Record<Property['publicador']['role'], string> = {
  ADMIN: 'Habbi',
  PERSONA: 'Propietario',
  CORREDORA: 'Corredora',
  INMOBILIARIA: 'Inmobiliaria',
};

@Component({
  selector: 'app-property-detail',
  imports: [RouterLink, IconComponent, GaleriaComponent, PropertyMapComponent, ConsultaFormComponent],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss',
})
export class PropertyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly properties = inject(PropertiesService);
  private readonly seo = inject(SeoService);
  private readonly metricas = inject(MetricasService);
  private readonly uf = inject(UfService);
  protected readonly favorites = inject(FavoritesService);

  readonly property = signal<Property | null>(null);
  readonly notFound = signal(false);

  protected readonly equivalente = computed(() => {
    const p = this.property();
    return p ? formatPrecioEquivalente(p, this.uf.valor()) : null;
  });

  protected readonly esFavorito = computed(() => {
    const p = this.property();
    return !!p && this.favorites.all().includes(p.slug);
  });

  // Solo los datos que existen: una ficha de terreno no muestra "0 dormitorios".
  protected readonly specs = computed(() => {
    const p = this.property();
    if (!p) return [];
    const specs: { icono: IconName; valor: string; label: string }[] = [];
    if (p.dormitorios !== null) specs.push({ icono: 'bed-double', valor: `${p.dormitorios}`, label: p.dormitorios === 1 ? 'Dormitorio' : 'Dormitorios' });
    if (p.banos !== null) specs.push({ icono: 'bath', valor: `${p.banos}`, label: p.banos === 1 ? 'Baño' : 'Baños' });
    if (p.m2Construidos !== null) specs.push({ icono: 'scaling', valor: `${p.m2Construidos} m²`, label: 'Construidos' });
    if (p.m2Terreno !== null) specs.push({ icono: 'scaling', valor: `${p.m2Terreno.toLocaleString('es-CL')} m²`, label: 'Terreno' });
    if (p.estacionamientos !== null) specs.push({ icono: 'car-front', valor: `${p.estacionamientos}`, label: 'Estacionamientos' });
    if (p.bodegas !== null) specs.push({ icono: 'building-2', valor: `${p.bodegas}`, label: p.bodegas === 1 ? 'Bodega' : 'Bodegas' });
    return specs;
  });

  readonly formatPrecio = formatPrecio;
  readonly formatTipoPropiedad = formatTipoPropiedad;
  readonly formatUbicacion = formatUbicacion;

  protected formatClp(valor: number): string {
    return CLP.format(valor);
  }

  protected rolLabel(role: Property['publicador']['role']): string {
    return ROL_LABEL[role];
  }

  protected clicWhatsapp(p: Property): void {
    this.metricas.registrar(p.slug, 'CLIC_WHATSAPP');
  }

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
        this.metricas.registrar(property.slug, 'VISTA');
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
