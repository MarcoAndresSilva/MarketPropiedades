import { RenderMode, ServerRoute } from '@angular/ssr';

// El catálogo depende de qué propiedades están PUBLICADA en un momento dado —
// prerender (build-time, congelado hasta el próximo deploy) no sirve acá. SSR real
// por request, hasta que el volumen justifique ISR/regeneración periódica.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
