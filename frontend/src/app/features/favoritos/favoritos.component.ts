import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { FavoritesService, esClaveProyecto, slugDeClave } from '../../core/favorites.service';
import { ProyectosService } from '../../core/proyectos.service';
import { Proyecto } from '../../core/proyecto.model';
import { ProyectoCardComponent } from '../proyectos/proyecto-card.component';
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
  imports: [RouterLink, IconComponent, PropertyCardComponent, PropertyCardSkeletonComponent, ProyectoCardComponent],
  templateUrl: './favoritos.component.html',
  styleUrl: './favoritos.component.scss',
})
export class FavoritosComponent implements OnInit {
  private readonly favorites = inject(FavoritesService);
  private readonly properties = inject(PropertiesService);
  private readonly proyectosService = inject(ProyectosService);
  private readonly seo = inject(SeoService);

  protected readonly items = signal<Property[]>([]);
  protected readonly proyectos = signal<Proyecto[]>([]);
  protected readonly loading = signal(true);
  protected readonly quitadas = signal(0);
  protected readonly skeletons = signal<number[]>([]);

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Tus favoritos',
      description: 'Las propiedades que guardaste en Habbi.',
      path: '/favoritos',
    });

    const claves = this.favorites.all();
    this.skeletons.set(claves.map((_, i) => i));
    if (claves.length === 0) {
      this.loading.set(false);
      return;
    }

    // Cada clave es una propiedad (slug a secas) o un proyecto ("proyecto:<slug>").
    forkJoin(
      claves.map((clave) =>
        (
          (esClaveProyecto(clave)
            ? this.proyectosService.findBySlug(slugDeClave(clave))
            : this.properties.findBySlug(clave)) as Observable<Property | Proyecto>
        ).pipe(
          map((item): Property | Proyecto | null => item),
          catchError(() => of(null)),
        ),
      ),
    ).subscribe((resultados) => {
      const gone = claves.filter((_, i) => resultados[i] === null);
      gone.forEach((clave) => this.favorites.toggle(clave));
      this.quitadas.set(gone.length);
      this.items.set(resultados.filter((r, i): r is Property => r !== null && !esClaveProyecto(claves[i])));
      this.proyectos.set(resultados.filter((r, i): r is Proyecto => r !== null && esClaveProyecto(claves[i])));
      this.loading.set(false);
    });
  }
}
