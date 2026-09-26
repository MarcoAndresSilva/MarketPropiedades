import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { IconComponent, IconName } from '../../core/icon.component';
import { RevealOnScrollDirective } from '../../core/reveal-on-scroll.directive';
import { BUSINESS_WHATSAPP } from '../../core/business-contact';
import { buildWhatsappUrl } from '../../core/whatsapp.util';

interface Plan {
  nombre: string;
  etiqueta: string;
  bajada: string;
  incluye: string[];
  destacado: boolean;
}

interface Pack {
  nombre: string;
  icono: IconName;
  bajada: string;
  incluye: string[];
}

// Planes y packs de marketing SIN precios: las tarifas todavía se están definiendo con
// el socio (la propuesta de planes y el modelo de negocio traen rangos distintos), así
// que cada opción lleva a cotizar por WhatsApp en vez de mostrar un número que puede
// cambiar. Los contenidos salen de esos dos documentos.
const PLANES: Plan[] = [
  {
    nombre: 'Gratis',
    etiqueta: 'Para empezar',
    bajada: 'Publica sin tarjeta ni compromiso.',
    incluye: [
      'Hasta 3 propiedades publicadas',
      'Ficha completa con fotos, datos y descripción',
      'Aparece en el catálogo y en el buscador',
      'Contacto directo por WhatsApp desde la ficha',
    ],
    destacado: false,
  },
  {
    nombre: 'Pro',
    etiqueta: 'Desde la 4ª propiedad',
    bajada: 'Para corredoras e inmobiliarias con cartera activa.',
    incluye: [
      'Propiedades ilimitadas',
      'Posición destacada en la portada',
      'Galería de fotos ampliada',
      'Video en la ficha de la propiedad',
    ],
    destacado: true,
  },
];

const PACKS: Pack[] = [
  {
    nombre: 'Pack Contenido',
    icono: 'house',
    bajada: 'Fotos que venden mejor.',
    incluye: ['Sesión fotográfica profesional', 'Optimización visual', 'Piezas para la publicación'],
  },
  {
    nombre: 'Pack Reel',
    icono: 'eye',
    bajada: 'Video vertical para redes.',
    incluye: ['Producción de video vertical', 'Edición', 'Texto para la publicación'],
  },
  {
    nombre: 'Pack Potencia',
    icono: 'trending-up',
    bajada: 'Contenido completo + visibilidad.',
    incluye: ['Fotografía + Reel', 'Contenido para redes sociales', 'Propiedad destacada en Habbi'],
  },
  {
    nombre: 'Pack Acelera',
    icono: 'chart-column-increasing',
    bajada: 'Campaña para captar interesados.',
    incluye: ['Producción y creatividad', 'Campaña en Meta Ads (Instagram y Facebook)', 'Seguimiento de contactos y reporte'],
  },
];

const PASOS: { titulo: string; texto: string }[] = [
  { titulo: 'Publica', texto: 'Tu propiedad entra al catálogo con su ficha completa.' },
  { titulo: 'Potencia', texto: 'Sumas fotos profesionales, video o posición destacada.' },
  { titulo: 'Difunde', texto: 'La llevamos a Instagram y Facebook con campañas pagadas.' },
  { titulo: 'Recibe contactos', texto: 'Los interesados te escriben directo por WhatsApp.' },
];

@Component({
  selector: 'app-servicios',
  imports: [RouterLink, IconComponent, RevealOnScrollDirective],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.scss',
})
export class ServiciosComponent implements OnInit {
  private readonly seo = inject(SeoService);

  protected readonly planes = PLANES;
  protected readonly packs = PACKS;
  protected readonly pasos = PASOS;

  protected cotizar(opcion: string): string {
    return buildWhatsappUrl(BUSINESS_WHATSAPP, `Hola, quiero cotizar el ${opcion} de Habbi para mi propiedad.`);
  }

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Servicios de marketing inmobiliario',
      description:
        'Planes para publicar tus propiedades y packs de fotografía, video y campañas en Meta Ads para venderlas o arrendarlas más rápido en Melipilla y alrededores.',
      path: '/servicios',
    });
  }
}
