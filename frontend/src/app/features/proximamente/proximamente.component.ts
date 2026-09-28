import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

// Página honesta para las secciones del menú que todavía se están construyendo
// (y para el 404): así ningún link del header queda roto entre una etapa y otra.
// El título y el texto vienen de `data` en app.routes.ts.
@Component({
  selector: 'app-proximamente',
  imports: [RouterLink],
  templateUrl: './proximamente.component.html',
  styleUrl: './proximamente.component.scss',
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
