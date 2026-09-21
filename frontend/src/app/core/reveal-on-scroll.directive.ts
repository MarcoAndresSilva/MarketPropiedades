import { AfterViewInit, Directive, ElementRef, OnDestroy, PLATFORM_ID, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Fade + slide sutil al entrar en pantalla — el patrón de "scroll-triggered reveal"
// que usan los portales reales (Compass, Rightmove) y que hoy no existe en ningún
// lado del sitio; todo aparece de golpe. Sin librería: un IntersectionObserver nativo
// + una clase CSS, mismo criterio que ya se usó para no meter Swiper en los sliders.
// SSR-safe (isPlatformBrowser, igual que el autoplay del hero) y respeta
// prefers-reduced-motion en el CSS que consume esta clase, no acá.
@Directive({
  selector: '[appRevealOnScroll]',
  host: { class: 'reveal' },
})
export class RevealOnScrollDirective implements AfterViewInit, OnDestroy {
  /** Retraso en ms, para escalonar varios elementos hermanos (ver .reveal--delay-N en _base.scss). */
  readonly revealDelay = input(0, { alias: 'appRevealOnScroll' });

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    if (this.revealDelay()) {
      this.el.nativeElement.style.setProperty('--reveal-delay', `${this.revealDelay()}ms`);
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.el.nativeElement.classList.add('reveal--visible');
          this.observer?.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
