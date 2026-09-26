import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

// Página honesta para las secciones del menú que todavía se están construyendo
// (y para el 404): así ningún link del header queda roto entre una etapa y otra.
// El título y el texto vienen de `data` en app.routes.ts.
@Component({
  selector: 'app-proximamente',
  imports: [RouterLink],
  template: `
    <main id="main-content" tabindex="-1" class="proximamente container">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h1>{{ titulo }}</h1>
      <p class="proximamente__texto">{{ texto }}</p>
      <a routerLink="/" class="btn btn--primary">Volver al inicio</a>
    </main>
  `,
  styles: `
    .proximamente {
      min-height: 55vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding-block: 80px;
    }
    h1 {
      font-size: clamp(1.8rem, 1.4rem + 1.8vw, 2.6rem);
      margin: 0 0 14px;
    }
    .proximamente__texto {
      max-width: 520px;
      margin: 0 0 28px;
      color: var(--text-muted);
      line-height: 1.6;
    }
  `,
})
export class ProximamenteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  protected eyebrow = '';
  protected titulo = '';
  protected texto = '';

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.eyebrow = data['eyebrow'] ?? 'Próximamente';
    this.titulo = data['titulo'];
    this.texto = data['texto'];
    this.seo.setPage({ title: this.titulo, description: this.texto, path: this.route.snapshot.url.join('/') ? `/${this.route.snapshot.url.join('/')}` : '/' });
  }
}
