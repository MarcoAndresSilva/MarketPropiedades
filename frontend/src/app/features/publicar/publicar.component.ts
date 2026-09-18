import { Component } from '@angular/core';
import { BUSINESS_WHATSAPP } from '../../core/business-contact';
import { buildWhatsappUrl } from '../../core/whatsapp.util';

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
  templateUrl: './publicar.component.html',
  styleUrl: './publicar.component.scss',
})
export class PublicarComponent {
  readonly pasos = PASOS;

  protected readonly contactoUrl = buildWhatsappUrl(
    BUSINESS_WHATSAPP,
    'Hola, tengo una propiedad y me gustaría publicarla en Market Propiedades.',
  );
}
