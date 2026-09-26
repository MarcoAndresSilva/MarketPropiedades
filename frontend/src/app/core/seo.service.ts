import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../environments/environment';
import { BRAND_NAME } from './brand';

export interface SeoPageData {
  title: string;
  description: string;
  /** Ruta relativa (ej. "/propiedad/casa-melipilla-xyz") — se arma la URL absoluta acá. */
  path: string;
  /** URL absoluta de una imagen para Open Graph/Twitter. Si no hay una real, se omite. */
  image?: string;
}

// Un solo lugar para setear title + meta description + Open Graph + Twitter Card +
// canonical en cada página — Angular's Meta/Title corren también durante SSR, así que
// esto queda en el HTML que recibe Google/el bot de previsualización, no solo en el
// navegador después de hidratar.
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  setPage(data: SeoPageData): void {
    const url = `${environment.siteUrl}${data.path}`;
    const fullTitle = `${data.title} | ${BRAND_NAME}`;

    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: data.description });

    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: BRAND_NAME });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:url', content: url });

    this.meta.updateTag({ name: 'twitter:card', content: data.image ? 'summary_large_image' : 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });

    if (data.image) {
      this.meta.updateTag({ property: 'og:image', content: data.image });
      this.meta.updateTag({ name: 'twitter:image', content: data.image });
    } else {
      this.meta.removeTag('property="og:image"');
      this.meta.removeTag('name="twitter:image"');
    }

    this.setCanonical(url);
  }

  /** Reemplaza el único <script type="application/ld+json"> de la página, si existe. */
  setJsonLd(data: object): void {
    this.clearJsonLd();
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.setAttribute('data-seo-jsonld', '');
    this.document.head.appendChild(script);
  }

  clearJsonLd(): void {
    this.document.querySelector('script[data-seo-jsonld]')?.remove();
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
