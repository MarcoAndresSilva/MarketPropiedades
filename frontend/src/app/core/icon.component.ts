import { Component, input } from '@angular/core';

// Íconos de línea del sitio — trazos copiados de Lucide (https://lucide.dev, licencia
// ISC) en vez de instalar la librería: son pocos, y así no dependemos de que su
// paquete de Angular declare compatibilidad con cada versión mayor nueva.
// Para sumar uno: copiar sus elementos desde lucide-static/icons/<nombre>.svg.
export type IconName =
  | 'heart'
  | 'map-pin'
  | 'house'
  | 'circle-dollar-sign'
  | 'chevron-down'
  | 'search'
  | 'bed-double'
  | 'bath'
  | 'scaling'
  | 'chart-no-axes-column-increasing'
  | 'arrow-right'
  | 'trending-up'
  | 'shield-check'
  | 'users'
  | 'chart-column-increasing'
  | 'eye'
  | 'message-circle'
  | 'menu'
  | 'x'
  | 'sun'
  | 'moon'
  | 'car-front'
  | 'building-2'
  | 'calendar-clock'
  | 'phone'
  | 'mail';

@Component({
  selector: 'app-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
      @case ('heart') {
        <svg:path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
      }
      @case ('map-pin') {
        <svg:path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
        <svg:circle cx="12" cy="10" r="3" />
      }
      @case ('house') {
        <svg:path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
        <svg:path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      }
      @case ('circle-dollar-sign') {
        <svg:circle cx="12" cy="12" r="10" />
        <svg:path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <svg:path d="M12 18V6" />
      }
      @case ('chevron-down') {
        <svg:path d="m6 9 6 6 6-6" />
      }
      @case ('search') {
        <svg:path d="m21 21-4.34-4.34" />
        <svg:circle cx="11" cy="11" r="8" />
      }
      @case ('bed-double') {
        <svg:path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
        <svg:path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
        <svg:path d="M12 4v6" />
        <svg:path d="M2 18h20" />
      }
      @case ('bath') {
        <svg:path d="M10 4 8 6" />
        <svg:path d="M17 19v2" />
        <svg:path d="M2 12h20" />
        <svg:path d="M7 19v2" />
        <svg:path d="M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
      }
      @case ('scaling') {
        <svg:path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <svg:path d="M14 15H9v-5" />
        <svg:path d="M16 3h5v5" />
        <svg:path d="M21 3 9 15" />
      }
      @case ('chart-no-axes-column-increasing') {
        <svg:path d="M5 21v-6" />
        <svg:path d="M12 21V9" />
        <svg:path d="M19 21V3" />
      }
      @case ('arrow-right') {
        <svg:path d="M5 12h14" />
        <svg:path d="m12 5 7 7-7 7" />
      }
      @case ('trending-up') {
        <svg:path d="M16 7h6v6" />
        <svg:path d="m22 7-8.5 8.5-5-5L2 17" />
      }
      @case ('shield-check') {
        <svg:path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <svg:path d="m9 12 2 2 4-4" />
      }
      @case ('users') {
        <svg:path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <svg:path d="M16 3.128a4 4 0 0 1 0 7.744" />
        <svg:path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <svg:circle cx="9" cy="7" r="4" />
      }
      @case ('chart-column-increasing') {
        <svg:path d="M13 17V9" />
        <svg:path d="M18 17V5" />
        <svg:path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <svg:path d="M8 17v-3" />
      }
      @case ('eye') {
        <svg:path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
        <svg:circle cx="12" cy="12" r="3" />
      }
      @case ('message-circle') {
        <svg:path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
      }
      @case ('menu') {
        <svg:path d="M4 5h16" />
        <svg:path d="M4 12h16" />
        <svg:path d="M4 19h16" />
      }
      @case ('x') {
        <svg:path d="M18 6 6 18" />
        <svg:path d="m6 6 12 12" />
      }
      @case ('sun') {
        <svg:circle cx="12" cy="12" r="4" />
        <svg:path d="M12 2v2" />
        <svg:path d="M12 20v2" />
        <svg:path d="m4.93 4.93 1.41 1.41" />
        <svg:path d="m17.66 17.66 1.41 1.41" />
        <svg:path d="M2 12h2" />
        <svg:path d="M20 12h2" />
        <svg:path d="m6.34 17.66-1.41 1.41" />
        <svg:path d="m19.07 4.93-1.41 1.41" />
      }
      @case ('moon') {
        <svg:path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
      }
      @case ('car-front') {
        <svg:path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8" />
        <svg:path d="M7 14h.01" />
        <svg:path d="M17 14h.01" />
        <svg:rect width="18" height="8" x="3" y="10" rx="2" />
        <svg:path d="M5 18v2" />
        <svg:path d="M19 18v2" />
      }
      @case ('building-2') {
        <svg:path d="M10 12h4" />
        <svg:path d="M10 8h4" />
        <svg:path d="M14 21v-3a2 2 0 0 0-4 0v3" />
        <svg:path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
        <svg:path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      }
      @case ('calendar-clock') {
        <svg:path d="M16 14v2.2l1.6 1" />
        <svg:path d="M16 2v3" />
        <svg:path d="M21 7.338V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2.338" />
        <svg:path d="M3 9h5.859" />
        <svg:path d="M8 2v3" />
        <svg:circle cx="16" cy="16" r="6" />
      }
      @case ('phone') {
        <svg:path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
      }
      @case ('mail') {
        <svg:path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
        <svg:rect x="2" y="4" width="20" height="16" rx="2" />
      }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 1.25em;
      height: 1.25em;
      flex-shrink: 0;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly strokeWidth = input(2);
}
