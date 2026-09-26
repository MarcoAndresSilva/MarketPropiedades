import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Property } from '../../core/property.model';
import { formatPrecio, formatTipoPropiedad, formatUbicacion } from '../../core/format.util';
import { cloudinaryImageUrl } from '../../core/cloudinary.util';
import { IconComponent } from '../../core/icon.component';
import { FavoritesService } from '../../core/favorites.service';

const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

@Component({
  selector: 'app-property-card',
  imports: [RouterLink, IconComponent],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.scss',
})
export class PropertyCardComponent {
  readonly property = input.required<Property>();

  protected readonly favorites = inject(FavoritesService);

  protected readonly titulo = computed(() => this.property().titulo);
  protected readonly esFavorito = computed(() => this.favorites.all().includes(this.property().slug));
  // En el render el "/ mes" del arriendo va más liviano que la cifra.
  protected readonly precioClp = computed(() => CLP.format(this.property().precioClp ?? 0));

  readonly formatPrecio = formatPrecio;
  readonly formatTipoPropiedad = formatTipoPropiedad;
  readonly formatUbicacion = formatUbicacion;
  readonly cloudinaryImageUrl = cloudinaryImageUrl;
}
