import { Component } from '@angular/core';

// Logo provisorio de Habbi, dibujado a imagen del render de marca mientras llega el
// archivo definitivo: la "H" es una casa (dos muros + techo en V como travesaño, con
// una ventana en violeta) y el punto de la "i" va en violeta. El resto de la palabra
// es texto real en Plus Jakarta Sans — escala con font-size y hereda color.
// El tamaño se controla con `font-size` desde el componente que lo usa.
@Component({
  selector: 'app-logo',
  template: `
    <span class="logo" aria-label="Habbi" role="img">
      <svg class="logo__h" viewBox="0 0 30 34" aria-hidden="true">
        <rect x="0" y="0" width="6.6" height="34" rx="0.6" />
        <rect x="23.4" y="0" width="6.6" height="34" rx="0.6" />
        <path d="M3.3 19.5 15 9.2l11.7 10.3" fill="none" stroke="currentColor" stroke-width="6.2" stroke-linejoin="miter" />
        <rect class="logo__window" x="11.8" y="25.2" width="6.4" height="6.4" rx="0.8" />
      </svg>
      <span class="logo__text" aria-hidden="true">abb<span class="logo__i">ı</span></span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      color: var(--text);
      font-size: 2rem;
    }
    .logo {
      display: inline-flex;
      align-items: baseline;
      line-height: 1;
    }
    .logo__h {
      width: 0.66em;
      height: 0.75em;
      margin-right: 0.03em;
      fill: currentColor;
      align-self: baseline;
    }
    .logo__window {
      fill: var(--accent);
    }
    .logo__text {
      font-weight: 800;
      letter-spacing: -0.045em;
    }
    .logo__i {
      position: relative;
      display: inline-block;
      line-height: 1;
    }
    .logo__i::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 0.1em;
      width: 0.2em;
      height: 0.2em;
      border-radius: 50%;
      background: var(--accent);
      transform: translateX(-50%);
    }
  `,
})
export class LogoComponent {}
