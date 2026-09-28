import { Component } from '@angular/core';

// Logo provisorio de Habbi, dibujado a imagen del render de marca mientras llega el
// archivo definitivo: la "H" es una casa (dos muros + techo en V como travesaño, con
// una ventana en violeta) y el punto de la "i" va en violeta. El resto de la palabra
// es texto real en Plus Jakarta Sans — escala con font-size y hereda color.
// El tamaño se controla con `font-size` desde el componente que lo usa.
@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
})
export class LogoComponent {}
