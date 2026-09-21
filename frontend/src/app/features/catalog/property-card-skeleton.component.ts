import { Component } from '@angular/core';

// Reemplaza el "Cargando…" en texto plano mientras llega la respuesta del catálogo —
// mismas proporciones que app-property-card (foto 3:2 + líneas de texto), con un
// shimmer sutil. No usa aria-hidden a medias: el <p role="status"> real sigue
// anunciando el estado a un lector de pantalla, esto es solo la señal visual.
@Component({
  selector: 'app-property-card-skeleton',
  template: `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton-card__photo"></div>
      <div class="skeleton-card__body">
        <div class="skeleton-card__line skeleton-card__line--tipo"></div>
        <div class="skeleton-card__line skeleton-card__line--comuna"></div>
        <div class="skeleton-card__line skeleton-card__line--precio"></div>
      </div>
    </div>
  `,
  styleUrl: './property-card-skeleton.component.scss',
})
export class PropertyCardSkeletonComponent {}
