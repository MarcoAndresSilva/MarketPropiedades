import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BUSINESS_WHATSAPP } from '../../core/business-contact';
import { buildWhatsappUrl } from '../../core/whatsapp.util';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  protected readonly anio = new Date().getFullYear();

  protected readonly contactoUrl = buildWhatsappUrl(
    BUSINESS_WHATSAPP,
    'Hola, tengo una consulta sobre Market Propiedades.',
  );
}
