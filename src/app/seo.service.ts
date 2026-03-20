import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface OpenGraphData {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  private readonly DEFAULT_IMAGE = 'https://dentipro.ro/logo-new.png';
  private readonly SITE_NAME = 'DentiPro';

  setTitle(t: string): void {
    this.title.setTitle(t);
    this.meta.updateTag({ property: 'og:title', content: t });
    this.meta.updateTag({ name: 'twitter:title', content: t });
  }

  setDescription(desc: string): void {
    this.meta.updateTag({ name: 'description', content: desc });
    this.meta.updateTag({ property: 'og:description', content: desc });
    this.meta.updateTag({ name: 'twitter:description', content: desc });
  }

  setCanonical(url: string): void {
    let link: HTMLLinkElement | null = this.doc.querySelector("link[rel='canonical']");
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
    this.meta.updateTag({ property: 'og:url', content: url });
  }

  setOpenGraph(data: OpenGraphData): void {
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:image', content: data.image || this.DEFAULT_IMAGE });
    this.meta.updateTag({ property: 'og:url', content: data.url || 'https://dentipro.ro' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: this.SITE_NAME });
    this.meta.updateTag({ property: 'og:locale', content: 'ro_RO' });
    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });
    this.meta.updateTag({ name: 'twitter:image', content: data.image || this.DEFAULT_IMAGE });
  }

  setStructuredData(schema: object): void {
    const id = 'ld-json-schema';
    // Remove previous dynamic schema to avoid stale data on navigation
    const existing = this.doc.getElementById(id);
    if (existing) existing.remove();

    const script = this.doc.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    this.doc.head.appendChild(script);
  }

  /** Convenience: set everything at once */
  set(opts: {
    title: string;
    description: string;
    canonical?: string;
    image?: string;
    schema?: object;
  }): void {
    this.setTitle(opts.title);
    this.setDescription(opts.description);
    this.setOpenGraph({
      title: opts.title,
      description: opts.description,
      image: opts.image,
      url: opts.canonical,
    });
    if (opts.canonical) this.setCanonical(opts.canonical);
    if (opts.schema) this.setStructuredData(opts.schema);
  }
}
