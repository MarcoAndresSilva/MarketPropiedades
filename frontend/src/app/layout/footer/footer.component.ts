import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BUSINESS_WHATSAPP } from '../../core/business-contact';
import { buildWhatsappUrl } from '../../core/whatsapp.util';
import { LogoComponent } from '../logo/logo.component';
import { IconComponent } from '../../core/icon.component';
import { BRAND_NAME } from '../../core/brand';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, LogoComponent, IconComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  protected readonly anio = new Date().getFullYear();

  protected readonly contactoUrl = buildWhatsappUrl(
    BUSINESS_WHATSAPP,
    `Hola, tengo una consulta sobre ${BRAND_NAME}.`,
  );
}
