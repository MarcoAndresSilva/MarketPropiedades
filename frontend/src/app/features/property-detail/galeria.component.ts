import { Component, HostListener, computed, inject, input, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { PropertyFoto } from '../../core/property.model';
import { cloudinaryImageUrl } from '../../core/cloudinary.util';
import { PhotoSliderComponent } from './photo-slider.component';

// Galería de la ficha: en desktop, una foto grande + hasta 4 miniaturas en grilla (el
// formato de los portales grandes: muestra varias fotos sin empujar el precio y el
// contacto bajo la primera pantalla). Tocar cualquier foto abre un visor a pantalla
// completa con todas. En celular se usa el deslizador directo, que ahí funciona mejor.
@Component({
  selector: 'app-galeria',
  imports: [PhotoSliderComponent],
  templateUrl: './galeria.component.html',
  styleUrl: './galeria.component.scss',
})
export class GaleriaComponent {
  private readonly document = inject(DOCUMENT);

  readonly fotos = input.required<PropertyFoto[]>();
  readonly titulo = input('');

  /** Índice de la foto con la que se abrió el visor; null = cerrado. */
  protected readonly visor = signal<number | null>(null);

  protected readonly miniaturas = computed(() => this.fotos().slice(1, 5));

  protected url(publicId: string, grande: boolean): string {
    return grande ? cloudinaryImageUrl(publicId, 1200, 800) : cloudinaryImageUrl(publicId, 600, 400);
  }

  protected abrir(indice: number): void {
    this.visor.set(indice);
    // Sin scroll de la página de fondo mientras el visor está abierto.
    this.document.body.style.overflow = 'hidden';
  }

  protected cerrar(): void {
    this.visor.set(null);
    this.document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.visor() !== null) this.cerrar();
  }
}
