import { Component, OnInit, inject } from '@angular/core';
import { BUSINESS_WHATSAPP } from '../../core/business-contact';
import { buildWhatsappUrl } from '../../core/whatsapp.util';
import { SeoService } from '../../core/seo.service';
import { RevealOnScrollDirective } from '../../core/reveal-on-scroll.directive';
import { BRAND_NAME } from '../../core/brand';

interface PasoPublicacion {
  numero: number;
  titulo: string;
  texto: string;
}

const PASOS: PasoPublicacion[] = [
  {
    numero: 1,
    titulo: 'Escríbenos por WhatsApp',
    texto:
      'Cuéntanos sobre tu propiedad: tipo, comuna, precio referencial y si es para venta o arriendo. No necesitas tener nada más listo todavía.',
  },
  {
    numero: 2,
    titulo: 'Armamos tu ficha',
    texto:
      'Coordinamos contigo las fotos (y video, si tienes) y redactamos la descripción. Tú revisas y das el visto bueno antes de publicar.',
  },
  {
    numero: 3,
    titulo: 'Recibes los contactos directo',
    texto:
      'Tu propiedad queda publicada con tu WhatsApp de contacto. Cuando alguien se interesa, te escribe directo a ti — sin intermediarios.',
  },
];

@Component({
  selector: 'app-publicar',
  imports: [RevealOnScrollDirective],
  templateUrl: './publicar.component.html',
  styleUrl: './publicar.component.scss',
})
export class PublicarComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly pasos = PASOS;

  protected readonly contactoUrl = buildWhatsappUrl(
    BUSINESS_WHATSAPP,
    `Hola, tengo una propiedad y me gustaría publicarla en ${BRAND_NAME}.`,
  );

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Cómo publicar tu propiedad',
      description:
        `Publica tu casa, departamento o parcela en ${BRAND_NAME}. Te contamos el proceso paso a paso: contáctanos por WhatsApp, armamos tu ficha y recibes los contactos directo.`,
      path: '/publicar',
    });
  }
}
