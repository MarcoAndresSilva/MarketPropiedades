import { Component, input, signal } from '@angular/core';
import { PropertyFoto } from '../../core/property.model';
import { cloudinaryImageUrl } from '../../core/cloudinary.util';

@Component({
  selector: 'app-photo-slider',
  templateUrl: './photo-slider.component.html',
  styleUrl: './photo-slider.component.scss',
})
export class PhotoSliderComponent {
  readonly fotos = input.required<PropertyFoto[]>();
  readonly currentIndex = signal(0);

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

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.prev();
    } else if (event.key === 'ArrowRight') {
      this.next();
    }
  }
}
