import { Component } from '@angular/core';

// Reemplaza el "Cargando…" en texto plano mientras llega la respuesta del catálogo —
// mismas proporciones que app-property-card (foto 16:11 + líneas de texto), con un
// shimmer sutil. No usa aria-hidden a medias: el <p role="status"> real sigue
// anunciando el estado a un lector de pantalla, esto es solo la señal visual.
@Component({
  selector: 'app-property-card-skeleton',
  templateUrl: './property-card-skeleton.component.html',
  styleUrl: './property-card-skeleton.component.scss',
})
export class PropertyCardSkeletonComponent {}
