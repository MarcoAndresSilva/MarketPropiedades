import { Component, input } from '@angular/core';

// Logo oficial de Habbi (archivo entregado por el socio), en public/marca/:
// - logo-habbi*.png: solo la palabra, para el header y el panel (a ~40px de alto el
//   lema "Propiedades en movimiento" quedaría ilegible).
// - logo-habbi-lema*.png: con el lema, para el footer, donde hay espacio.
// - "-claro": versión con el navy pasado a blanco para el tema oscuro (el violeta se
//   mantiene); se muestra una u otra según el data-theme de <html>.
// El alto se controla con `font-size` desde el componente que lo usa, igual que antes.
@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
})
export class LogoComponent {
  /** true = versión con el lema "Propiedades en movimiento" debajo. */
  readonly lema = input(false);
}
