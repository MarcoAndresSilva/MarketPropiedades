import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import compression from 'compression';
import { join } from 'node:path';
import { environment } from './environments/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Sin esto, Express manda el HTML/JS/CSS sin comprimir — Lighthouse lo marcó como el
// hallazgo de performance más grande del sitio (~7s de "Enable text compression" en
// las tres páginas auditadas). gzip/brotli via Accept-Encoding es soporte universal en
// cualquier navegador real, no hay ninguna razón para no comprimir por defecto.
app.use(compression());

// sitemap.xml se genera en cada request, no en build time: el catálogo cambia cuando
// alguien publica una propiedad, sin un nuevo deploy (mismo motivo por el que el
// catálogo es RenderMode.Server y no Prerender — ver ARCHITECTURE.md).
async function obtenerSlugsPublicados(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  const pageSize = 50;

  for (;;) {
    const res = await fetch(`${environment.apiUrl}/properties?page=${page}&pageSize=${pageSize}`);
    if (!res.ok) break;

    const data = (await res.json()) as { items: { slug: string }[] };
    slugs.push(...data.items.map((p) => p.slug));

    if (data.items.length < pageSize) break;
    page += 1;
  }

  return slugs;
}

app.get('/sitemap.xml', async (_req, res) => {
  const rutasEstaticas = ['/', '/publicar'];
  let slugsPropiedades: string[] = [];

  try {
    slugsPropiedades = await obtenerSlugsPublicados();
  } catch {
    // Si el backend no responde, el sitemap sale igual con las rutas estáticas -
    // mejor un sitemap incompleto que una respuesta 500 para el crawler.
  }

  const urls = [
    ...rutasEstaticas.map((path) => `${environment.siteUrl}${path}`),
    ...slugsPropiedades.map((slug) => `${environment.siteUrl}/propiedad/${slug}`),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${url}</loc></url>`),
    '</urlset>',
  ].join('\n');

  res.type('application/xml').send(xml);
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
