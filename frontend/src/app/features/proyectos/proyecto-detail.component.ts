import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProyectosService } from '../../core/proyectos.service';
import { ETAPA_LABEL, Proyecto, formatRango } from '../../core/proyecto.model';
import { formatUbicacion, truncarEnPalabra } from '../../core/format.util';
import { SeoService } from '../../core/seo.service';
import { IconComponent, IconName } from '../../core/icon.component';
import { FavoritesService, claveProyecto } from '../../core/favorites.service';
import { buildWhatsappUrl } from '../../core/whatsapp.util';
import { cloudinaryImageUrl } from '../../core/cloudinary.util';
import { BRAND_NAME } from '../../core/brand';
import { environment } from '../../../environments/environment';
import { GaleriaComponent } from '../property-detail/galeria.component';
import { PropertyMapComponent } from '../property-detail/property-map.component';

// Ficha de proyecto: misma estructura y estilos que la de propiedad (título, galería,
// datos y columna de contacto), pero con "Desde UF", rangos, etapa y fecha de entrega.
@Component({
  selector: 'app-proyecto-detail',
  imports: [RouterLink, IconComponent, GaleriaComponent, PropertyMapComponent],
  templateUrl: './proyecto-detail.component.html',
  styleUrls: ['../property-detail/property-detail.component.scss', './proyecto-detail.component.scss'],
})
export class ProyectoDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly proyectos = inject(ProyectosService);
  private readonly seo = inject(SeoService);
  protected readonly favorites = inject(FavoritesService);

  protected readonly proyecto = signal<Proyecto | null>(null);
  protected readonly notFound = signal(false);

  protected readonly clave = computed(() => claveProyecto(this.proyecto()?.slug ?? ''));
  protected readonly esFavorito = computed(() => this.favorites.all().includes(this.clave()));
  protected readonly etapa = computed(() => {
    const p = this.proyecto();
    return p ? ETAPA_LABEL[p.etapa] : '';
  });
  protected readonly ubicacion = computed(() => {
    const p = this.proyecto();
    return p ? formatUbicacion(p.comuna) : '';
  });
  protected readonly precioDesde = computed(() => Number(this.proyecto()?.precioDesdeUf ?? 0).toLocaleString('es-CL'));

  protected readonly specs = computed(() => {
    const p = this.proyecto();
    if (!p) return [];
    const specs: { icono: IconName; valor: string; label: string }[] = [];
    const dorm = formatRango(p.dormitoriosMin, p.dormitoriosMax);
    const banos = formatRango(p.banosMin, p.banosMax);
    const m2 = formatRango(p.m2Min, p.m2Max, ' m²');
    if (dorm) specs.push({ icono: 'bed-double', valor: dorm, label: 'Dormitorios' });
    if (banos) specs.push({ icono: 'bath', valor: banos, label: 'Baños' });
    if (m2) specs.push({ icono: 'scaling', valor: m2, label: 'Superficie' });
    if (p.unidades) specs.push({ icono: 'building-2', valor: `${p.unidades}`, label: 'Unidades' });
    if (p.entrega) specs.push({ icono: 'calendar-clock', valor: p.entrega, label: 'Entrega' });
    return specs;
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.notFound.set(true);
      return;
    }
    this.proyectos.findBySlug(slug).subscribe({
      next: (p) => {
        this.proyecto.set(p);
        this.setSeo(p);
      },
      error: () => this.notFound.set(true),
    });
  }

  protected whatsappUrl(p: Proyecto, motivo: 'info' | 'cotizar'): string {
    const texto =
      motivo === 'info'
        ? `Hola, quiero más información del proyecto "${p.nombre}" que vi en ${BRAND_NAME}.`
        : `Hola, quiero cotizar una unidad del proyecto "${p.nombre}" que vi en ${BRAND_NAME}.`;
    return buildWhatsappUrl(p.publicador.whatsapp ?? '', texto);
  }

  private setSeo(p: Proyecto): void {
    const desde = p.precioDesdeUf ? ` desde UF ${Number(p.precioDesdeUf).toLocaleString('es-CL')}` : '';
    const path = `/proyecto/${p.slug}`;
    let image: string | undefined;
    if (p.fotos.length > 0) {
      const url = cloudinaryImageUrl(p.fotos[0].cloudinaryPublicId, 1200, 630);
      image = url.startsWith('http') ? url : `${environment.siteUrl}${url}`;
    }
    this.seo.setPage({
      title: `${p.nombre} — proyecto en ${p.comuna.nombre}`,
      description: truncarEnPalabra(`${p.nombre}, ${ETAPA_LABEL[p.etapa].toLowerCase()}${desde}. ${p.descripcion}`, 157),
      path,
      image,
    });
    this.seo.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'ApartmentComplex',
      name: p.nombre,
      description: p.descripcion,
      url: `${environment.siteUrl}${path}`,
      ...(image ? { image } : {}),
      address: {
        '@type': 'PostalAddress',
        addressLocality: p.comuna.nombre,
        addressRegion: p.comuna.region.nombre,
        addressCountry: 'CL',
      },
      ...(p.lat !== null && p.lng !== null ? { geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng } } : {}),
    });
  }
}
