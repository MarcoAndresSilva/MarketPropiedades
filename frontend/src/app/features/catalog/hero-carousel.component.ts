import { Component, DestroyRef, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Dos formas de slide:
// - "valor": tarjeta de texto con un beneficio real del producto (lo que hay hoy).
// - "banner": una imagen completa (el diseño ya viene armado por marketing, con su
//   propio texto/oferta adentro de la imagen) + un link opcional al hacer click.
// Julián reemplaza/agrega banners tipo imagen sin que el componente cambie.
export type HeroSlide =
  | { kind: 'valor'; title: string; text: string; tone: 'accent' | 'success' | 'neutral' }
  | { kind: 'banner'; imageUrl: string; alt: string; href?: string };

// Mensajes reales del negocio, no estadísticas inventadas — Julián (marketing) agrega
// banners tipo imagen a este mismo array cuando los tenga.
const SLIDES: HeroSlide[] = [
  {
    kind: 'valor',
    title: 'Contacto directo, sin vueltas',
    text: 'Escríbele al dueño o a la corredora por WhatsApp directo desde la ficha — sin formularios ni esperar que alguien más te responda.',
    tone: 'accent',
  },
  {
    kind: 'valor',
    title: 'Agenda tu visita en un clic',
    text: 'Cada propiedad tiene un botón para coordinar la visita directo por WhatsApp, al tiro.',
    tone: 'success',
  },
  {
    kind: 'valor',
    title: 'Hecho para que te encuentren',
    text: 'Cada ficha es indexable en Google — no queda escondida dentro de la plataforma, como en otros portales.',
    tone: 'neutral',
  },
];

const AUTOPLAY_MS = 6000;

@Component({
  selector: 'app-hero-carousel',
  templateUrl: './hero-carousel.component.html',
  styleUrl: './hero-carousel.component.scss',
})
export class HeroCarouselComponent implements OnInit {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private intervalId?: ReturnType<typeof setInterval>;

  readonly slides = SLIDES;
  readonly currentIndex = signal(0);

  ngOnInit(): void {
    if (!this.isBrowser) {
      return; // el autoplay es un detalle de interacción, no hace falta durante SSR
    }
    this.startAutoplay();
    this.destroyRef.onDestroy(() => this.stopAutoplay());
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
    this.restartAutoplay();
  }

  pause(): void {
    this.stopAutoplay();
  }

  resume(): void {
    this.startAutoplay();
  }

  private startAutoplay(): void {
    this.intervalId = setInterval(() => {
      this.currentIndex.update((i) => (i + 1) % this.slides.length);
    }, AUTOPLAY_MS);
  }

  private stopAutoplay(): void {
    clearInterval(this.intervalId);
  }

  private restartAutoplay(): void {
    this.stopAutoplay();
    this.startAutoplay();
  }
}
