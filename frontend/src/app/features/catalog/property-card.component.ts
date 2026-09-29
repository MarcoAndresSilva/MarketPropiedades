import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Property } from '../../core/property.model';
import { formatPrecio, formatTipoPropiedad, formatUbicacion } from '../../core/format.util';
import { IconComponent } from '../../core/icon.component';
import { FavoritesService } from '../../core/favorites.service';
import { CardFotosComponent } from './card-fotos.component';

const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

@Component({
  selector: 'app-property-card',
  imports: [RouterLink, IconComponent, CardFotosComponent],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.scss',
})
export class PropertyCardComponent {
  readonly property = input.required<Property>();

  protected readonly favorites = inject(FavoritesService);

  protected readonly titulo = computed(() => this.property().titulo);
  protected readonly fotoIds = computed(() => this.property().fotos.map((f) => f.cloudinaryPublicId));
  protected readonly esFavorito = computed(() => this.favorites.all().includes(this.property().slug));
  // En el render el "/ mes" del arriendo va más liviano que la cifra.
  protected readonly precioClp = computed(() => CLP.format(this.property().precioClp ?? 0));

  readonly formatPrecio = formatPrecio;
  readonly formatTipoPropiedad = formatTipoPropiedad;
  readonly formatUbicacion = formatUbicacion;
}
