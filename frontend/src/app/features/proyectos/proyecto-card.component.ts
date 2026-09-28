import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ETAPA_LABEL, Proyecto, formatRango } from '../../core/proyecto.model';
import { formatUbicacion } from '../../core/format.util';
import { cloudinaryImageUrl } from '../../core/cloudinary.util';
import { IconComponent } from '../../core/icon.component';
import { FavoritesService, claveProyecto } from '../../core/favorites.service';

// Card de proyecto del render: badge verde "Proyecto", "Desde UF 1.700" y rangos
// ("1 – 3" dormitorios, "45 – 95 m²"). Reusa los estilos de la card de propiedad
// para que las dos convivan en la misma grilla sin verse distintas.
@Component({
  selector: 'app-proyecto-card',
  imports: [RouterLink, IconComponent],
  templateUrl: './proyecto-card.component.html',
  styleUrl: '../catalog/property-card.component.scss',
})
export class ProyectoCardComponent {
  readonly proyecto = input.required<Proyecto>();

  protected readonly favorites = inject(FavoritesService);
  protected readonly clave = computed(() => claveProyecto(this.proyecto().slug));
  protected readonly esFavorito = computed(() => this.favorites.all().includes(this.clave()));

  protected readonly precioDesde = computed(() => Number(this.proyecto().precioDesdeUf).toLocaleString('es-CL'));
  protected readonly etapa = computed(() => ETAPA_LABEL[this.proyecto().etapa]);
  protected readonly dormitorios = computed(() => formatRango(this.proyecto().dormitoriosMin, this.proyecto().dormitoriosMax));
  protected readonly banos = computed(() => formatRango(this.proyecto().banosMin, this.proyecto().banosMax));
  protected readonly m2 = computed(() => formatRango(this.proyecto().m2Min, this.proyecto().m2Max, ' m²'));
  protected readonly ubicacion = computed(() => formatUbicacion(this.proyecto().comuna));

  readonly cloudinaryImageUrl = cloudinaryImageUrl;
}
