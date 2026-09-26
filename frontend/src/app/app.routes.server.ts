import { RenderMode, ServerRoute } from '@angular/ssr';

// El catálogo depende de qué propiedades están PUBLICADA en un momento dado —
// prerender (build-time, congelado hasta el próximo deploy) no sirve acá. SSR real
// por request, hasta que el volumen justifique ISR/regeneración periódica.
export const serverRoutes: ServerRoute[] = [
  // Panel de administración: detrás de login, nadie lo indexa y nadie lo visita con
  // mala señal esperando un preview rápido — renderizarlo en servidor solo agregaría
  // latencia sin ningún beneficio real (misma decisión que en Fase 9, ahora aplicada).
  {
    path: 'admin/**',
    renderMode: RenderMode.Client
  },
  // Los favoritos viven en localStorage: en el servidor no hay forma de saber cuáles
  // son, así que renderizarla ahí solo mostraría "no tienes favoritos" y un salto.
  {
    path: 'favoritos',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
