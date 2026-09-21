import type { Config } from '@netlify/functions';
import { environment } from '../../src/environments/environment';

// Vive como Netlify Function aparte, no dentro de server.ts: el plugin de Angular en
// Netlify (@netlify/angular-runtime) solo auto-detecta y reemplaza server.ts si es
// exactamente el archivo por defecto del scaffold - cualquier ruta custom agregada ahí
// (como esta) hacía que Netlify no generara ninguna función SSR (ver ARCHITECTURE.md).
// Se genera en cada request, no en build time: el catálogo cambia cuando alguien
// publica una propiedad, sin un nuevo deploy.
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

export default async (): Promise<Response> => {
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

  return new Response(xml, { headers: { 'content-type': 'application/xml' } });
};

export const config: Config = {
  path: '/sitemap.xml',
};
