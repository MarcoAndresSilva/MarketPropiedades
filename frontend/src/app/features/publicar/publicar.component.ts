import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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

// El camino de autoservicio (Fases 35-38): cuenta, propiedad y revisión del equipo. Subirla
// "por nosotros" sigue existiendo y queda como alternativa por WhatsApp debajo del botón.
const PASOS: PasoPublicacion[] = [
  {
    numero: 1,
    titulo: 'Crea tu cuenta',
    texto:
      'Elige si eres propietario, corredora o inmobiliaria, deja tu WhatsApp de contacto y confirma tu correo. Es gratis.',
  },
  {
    numero: 2,
    titulo: 'Carga tu propiedad',
    texto:
      'Desde tu panel completas los datos, el precio y las fotos. Puedes guardarla como borrador y terminarla después.',
  },
  {
    numero: 3,
    titulo: 'La revisamos y se publica',
    texto:
      'Nuestro equipo revisa cada ficha antes de publicarla y te avisa por correo. Los interesados te escriben directo a tu WhatsApp.',
  },
];

@Component({
  selector: 'app-publicar',
  imports: [RouterLink, RevealOnScrollDirective],
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
        `Publica gratis tu casa, departamento o parcela en ${BRAND_NAME}: crea tu cuenta, carga tu propiedad y recibe los contactos directo en tu WhatsApp.`,
      path: '/publicar',
    });
  }
}
