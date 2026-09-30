import { Component, ElementRef, OnInit, afterNextRender, inject, input, signal } from '@angular/core';
import { PropertyFoto } from '../../core/property.model';
import { cloudinaryImageUrl } from '../../core/cloudinary.util';

@Component({
  selector: 'app-photo-slider',
  templateUrl: './photo-slider.component.html',
  styleUrl: './photo-slider.component.scss',
})
export class PhotoSliderComponent implements OnInit {
  readonly fotos = input.required<PropertyFoto[]>();
  /** Foto con la que parte (el visor se abre en la miniatura que se tocó). */
  readonly inicio = input(0);
  /** 'visor': foto completa sin recortar, a pantalla completa, con foco de teclado al abrir. */
  readonly modo = input<'ficha' | 'visor'>('ficha');
  readonly currentIndex = signal(0);
  // Con más fotos que esto, los puntos no caben ni se pueden tocar en un celular: queda
  // solo el contador "3 / 21".
  protected readonly maxPuntos = 8;
  private toqueInicio: { x: number; y: number } | null = null;

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  constructor() {
    afterNextRender(() => {
      if (this.modo() === 'visor') {
        this.host.nativeElement.querySelector<HTMLElement>('.slider')?.focus();
      }
    });
  }

  ngOnInit(): void {
    this.currentIndex.set(this.inicio());
  }

  /** En el visor se pide la foto más grande a Cloudinary; en la ficha, la del tamaño del recuadro. */
  protected url(publicId: string): string {
    return this.modo() === 'visor' ? cloudinaryImageUrl(publicId, 1600, 1067) : cloudinaryImageUrl(publicId, 900, 600);
  }

  readonly cloudinaryImageUrl = cloudinaryImageUrl;

  prev(): void {
    const total = this.fotos().length;
    this.currentIndex.update((i) => (i - 1 + total) % total);
  }

  next(): void {
    const total = this.fotos().length;
    this.currentIndex.update((i) => (i + 1) % total);
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
  }

  // Deslizar con el dedo: un gesto mayormente horizontal de al menos 40px cambia de foto.
  // Si es más vertical que horizontal, es scroll de la página y no se toca.
  protected onTouchStart(event: TouchEvent): void {
    const t = event.touches[0];
    this.toqueInicio = { x: t.clientX, y: t.clientY };
  }

  protected onTouchEnd(event: TouchEvent): void {
    if (!this.toqueInicio) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - this.toqueInicio.x;
    const dy = t.clientY - this.toqueInicio.y;
    this.toqueInicio = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) {
      this.next();
    } else {
      this.prev();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.prev();
    } else if (event.key === 'ArrowRight') {
      this.next();
    }
  }
}
