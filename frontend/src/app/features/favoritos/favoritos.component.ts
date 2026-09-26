import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { FavoritesService } from '../../core/favorites.service';
import { PropertiesService } from '../../core/properties.service';
import { Property } from '../../core/property.model';
import { SeoService } from '../../core/seo.service';
import { IconComponent } from '../../core/icon.component';
import { PropertyCardComponent } from '../catalog/property-card.component';
import { PropertyCardSkeletonComponent } from '../catalog/property-card-skeleton.component';

// Propiedades guardadas con el corazón. Los favoritos viven en el navegador (el
// comprador no tiene cuenta), así que esta ruta se renderiza solo en el cliente
// (ver app.routes.server.ts): en el servidor no hay forma de saber qué guardó cada uno.
// Se piden los datos frescos de cada ficha; las que ya no están publicadas (404) se
// quitan de la lista en vez de mostrar una card rota o un precio viejo.
@Component({
  selector: 'app-favoritos',
  imports: [RouterLink, IconComponent, PropertyCardComponent, PropertyCardSkeletonComponent],
  template: `
    <main id="main-content" tabindex="-1" class="container favoritos">
      <header class="page-head">
        <p class="eyebrow">Tus favoritos</p>
        <h1>Propiedades guardadas</h1>
        <p>Se guardan en este navegador: si entras desde otro dispositivo no las vas a ver ahí.</p>
      </header>

      @if (loading()) {
        <p role="status" class="sr-only">Cargando tus favoritos…</p>
        <div class="property-grid" aria-hidden="true">
          @for (i of skeletons(); track i) {
            <app-property-card-skeleton />
          }
        </div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <app-icon name="heart" [strokeWidth]="1.6" />
          <h2>Todavía no guardas propiedades</h2>
          <p>Toca el corazón de cualquier propiedad para guardarla aquí y compararla después.</p>
          <a routerLink="/propiedades" class="btn btn--primary">Ver propiedades</a>
        </div>
      } @else {
        @if (quitadas() > 0) {
          <p class="favoritos__aviso" role="status">
            {{ quitadas() === 1 ? 'Una propiedad que guardaste ya no está publicada' : quitadas() + ' propiedades que guardaste ya no están publicadas' }}
            y la quitamos de tu lista.
          </p>
        }
        <ul class="property-grid" role="list">
          @for (property of items(); track property.id) {
            <li><app-property-card [property]="property" /></li>
          }
        </ul>
      }
    </main>
  `,
  styles: `
    .favoritos {
      padding-bottom: 72px;
    }
    .favoritos__aviso {
      margin: 0 0 20px;
      padding: 12px 16px;
      border-radius: 10px;
      background: var(--accent-soft);
      color: var(--text);
      font-size: 0.9rem;
    }
  `,
})
export class FavoritosComponent implements OnInit {
  private readonly favorites = inject(FavoritesService);
  private readonly properties = inject(PropertiesService);
  private readonly seo = inject(SeoService);

  protected readonly items = signal<Property[]>([]);
  protected readonly loading = signal(true);
  protected readonly quitadas = signal(0);
  protected readonly skeletons = signal<number[]>([]);

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Tus favoritos',
      description: 'Las propiedades que guardaste en Habbi.',
      path: '/favoritos',
    });

    const slugs = this.favorites.all();
    this.skeletons.set(slugs.map((_, i) => i));
    if (slugs.length === 0) {
      this.loading.set(false);
      return;
    }

    forkJoin(
      slugs.map((slug) =>
        this.properties.findBySlug(slug).pipe(
          map((p): Property | null => p),
          catchError(() => of(null)),
        ),
      ),
    ).subscribe((resultados) => {
      const vigentes = resultados.filter((p): p is Property => p !== null);
      const gone = slugs.filter((slug) => !vigentes.some((p) => p.slug === slug));
      gone.forEach((slug) => this.favorites.toggle(slug));
      this.quitadas.set(gone.length);
      this.items.set(vigentes);
      this.loading.set(false);
    });
  }
}
