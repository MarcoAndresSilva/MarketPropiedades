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
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly strokeWidth = input(2);
}
