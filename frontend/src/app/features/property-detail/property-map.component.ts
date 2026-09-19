import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type * as Leaflet from 'leaflet';

// Leaflet manipula el DOM directo (crea el mapa contra un elemento real) y no tiene
// ningún sentido durante SSR - se carga de forma diferida (import dinámico) y solo en
// el navegador, igual que el autoplay del hero (ver ARCHITECTURE.md).
@Component({
  selector: 'app-property-map',
  template: `<div #mapContainer class="property-map" role="img" [attr.aria-label]="ariaLabel()"></div>`,
  styles: `
    .property-map {
      width: 100%;
      height: 320px;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
  `,
})
export class PropertyMapComponent implements AfterViewInit, OnDestroy {
  readonly lat = input.required<number>();
  readonly lng = input.required<number>();
  readonly ariaLabel = input('Ubicación aproximada de la propiedad');

  @ViewChild('mapContainer') private readonly mapContainer!: ElementRef<HTMLDivElement>;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private map?: Leaflet.Map;

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;

    const L = await import('leaflet');

    // Fix conocido de Leaflet + bundlers: `Icon.Default._getIconUrl` SIEMPRE antepone
    // una ruta auto-detectada (vía un truco de CSS) delante de la URL configurada, así
    // que ni siquiera `Icon.Default.mergeOptions({ iconUrl: ... })` sirve para
    // reemplazarla del todo (queda con un prefijo tipo "/media//leaflet/..." roto). La
    // salida real es no tocar Icon.Default y armar un ícono propio con L.icon(), que no
    // tiene ese comportamiento — apuntando a copias propias de los PNG en public/.
    const iconoPin = L.icon({
      iconUrl: '/leaflet/marker-icon.png',
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      shadowUrl: '/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [this.lat(), this.lng()],
      zoom: 15,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    L.marker([this.lat(), this.lng()], { icon: iconoPin }).addTo(this.map);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
