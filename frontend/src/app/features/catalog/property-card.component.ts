import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Property } from '../../core/property.model';
import { formatPrecio, formatTipoPropiedad } from '../../core/format.util';
import { cloudinaryImageUrl } from '../../core/cloudinary.util';

@Component({
  selector: 'app-property-card',
  imports: [RouterLink],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.scss',
})
export class PropertyCardComponent {
  readonly property = input.required<Property>();

  readonly formatPrecio = formatPrecio;
  readonly formatTipoPropiedad = formatTipoPropiedad;
  readonly cloudinaryImageUrl = cloudinaryImageUrl;
}
