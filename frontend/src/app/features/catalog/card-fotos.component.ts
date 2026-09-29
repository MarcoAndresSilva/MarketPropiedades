import { Component, ElementRef, computed, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { cloudinaryImageUrl } from '../../core/cloudinary.util';

const MAX_FOTOS = 5;

// Carrusel de fotos de las cards (home, listados, favoritos). Es un contenedor con
// scroll horizontal y scroll-snap: en celular se desliza con el dedo sin JavaScript, y
// en desktop las flechas solo mueven ese scroll. Solo la primera foto se descarga de
// entrada; la siguiente, cuando el visitante muestra interés (pasa el mouse o toca la
// card), y así de a una. `loading="lazy"` no alcanzaba: Chrome precarga las fotos
// cercanas de un scroll horizontal aunque estén ocultas, y una grilla de 12 cards bajaba
// 60 fotos. Tope de 5 fotos: el resto está en la ficha.
@Component({
  selector: 'app-card-fotos',
  imports: [RouterLink],
  templateUrl: './card-fotos.component.html',
  styleUrl: './card-fotos.component.scss',
})
export class CardFotosComponent {
  /** publicIds de Cloudinary (o rutas de relleno), en orden. */
  readonly fotos = input.required<string[]>();
  readonly alt = input('');
  readonly link = input.required<string[]>();

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  protected readonly visibles = computed(() => this.fotos().slice(0, MAX_FOTOS));
  protected readonly actual = signal(0);
  /** Índices cuya foto ya tiene src (se descargó o se está descargando). */
  protected readonly cargadas = signal(new Set([0]));

  /** Pide la foto siguiente a la visible, para que el próximo paso no espere la descarga. */
  protected precargar(): void {
    this.cargar(this.actual() + 1);
  }

  private cargar(indice: number): void {
    if (indice >= this.visibles().length || this.cargadas().has(indice)) return;
    this.cargadas.update((c) => new Set(c).add(indice));
  }

  protected url(publicId: string): string {
    return cloudinaryImageUrl(publicId, 640, 440);
  }

  protected mover(direccion: 1 | -1): void {
    const el = this.track()?.nativeElement;
    if (!el) return;
    const total = this.visibles().length;
    // Al llegar al final vuelve al principio (y al revés), como el slider de la ficha.
    const destino = (this.actual() + direccion + total) % total;
    this.cargar(destino);
    el.scrollTo({ left: destino * el.clientWidth, behavior: 'smooth' });
  }

  protected onScroll(): void {
    const el = this.track()?.nativeElement;
    if (!el || el.clientWidth === 0) return;
    this.actual.set(Math.round(el.scrollLeft / el.clientWidth));
    this.cargar(this.actual());
    this.precargar();
  }
}
