import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClinicDataService, Clinic } from '../clinic-data.service';
import { ServiciiService } from '../servicii.service';
import { SeoService } from '../seo.service';

@Component({
  selector: 'app-clinic-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './clinic-list.component.html',
  styleUrl: './clinic-list.component.css',
})
export class ClinicListComponent implements OnInit {
  clinics: any[] = [];
  isLoading = true;
  isLoadingMore = false;
  hasMore = false;
  total = 0;
  serviciu = '';
  oras = '';
  serviciuLabel = '';

  private offset = 0;
  private readonly PAGE_SIZE = 24;

  readonly allServices: { id: string; label: string }[];

  constructor(
    private route: ActivatedRoute,
    private clinicData: ClinicDataService,
    private serviciiService: ServiciiService,
    private seo: SeoService,
  ) {
    this.allServices = this.serviciiService.getServices();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.serviciu = params.get('serviciu') || '';
      this.oras = params.get('oras') || '';
      this.serviciuLabel = this.allServices.find(s => s.id === this.serviciu)?.label || this.serviciu;
      this.clinics = [];
      this.offset = 0;
      this.load(true);
      this.setSeo();
    });
  }

  private load(initial = false) {
    if (initial) this.isLoading = true;
    else this.isLoadingMore = true;

    this.clinicData.loadPage({
      limit: this.PAGE_SIZE,
      offset: this.offset,
      city: this.oras || undefined,
      service: this.serviciu || undefined,
    }).subscribe({
      next: (page) => {
        const parsed = this.parseClinics(page.clinics);
        this.clinics = initial ? parsed : [...this.clinics, ...parsed];
        this.total = page.total;
        this.hasMore = page.hasMore;
        this.offset += parsed.length;
        this.isLoading = false;
        this.isLoadingMore = false;
      },
      error: () => {
        this.isLoading = false;
        this.isLoadingMore = false;
      },
    });
  }

  private parseClinics(data: any[]): any[] {
    return data.map(c => {
      let images: string[] = [];
      if (Array.isArray(c.images) && c.images.length > 0) {
        images = c.images;
      } else if (typeof c.clinic_images === 'string') {
        try { images = JSON.parse(c.clinic_images || '[]'); } catch { images = []; }
      }
      return { ...c, images, logo_url: c.logo_url || c.logo_path || null };
    });
  }

  loadMore() {
    if (!this.hasMore || this.isLoadingMore) return;
    this.load(false);
  }

  private setSeo() {
    const orasDisplay = this.oras ? ` în ${this.formatCity(this.oras)}` : ' în România';
    const title = `${this.serviciuLabel}${orasDisplay} — Clinici stomatologice | DentiPro`;
    const desc = `Găsește clinici stomatologice pentru ${this.serviciuLabel.toLowerCase()}${orasDisplay}. Prețuri, galerie foto, recenzii și programare online.`;
    const canonical = `https://dentipro.ro/dentisti/${this.serviciu}${this.oras ? '/' + this.oras : ''}`;
    this.seo.set({
      title, description: desc, canonical,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: title,
        description: desc,
        url: canonical,
      },
    });
  }

  formatCity(slug: string): string {
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  get h1(): string {
    const orasDisplay = this.oras ? ` în ${this.formatCity(this.oras)}` : ' în România';
    return `${this.serviciuLabel}${orasDisplay}`;
  }

  getServicePrice(clinic: any): string {
    const s = clinic.services?.find((sv: any) => sv.service_id === this.serviciu);
    if (!s || s.price_min == null) return '';
    if (s.price_type === 'range' && s.price_max != null) return `${s.price_min}–${s.price_max} RON`;
    return `de la ${s.price_min} RON`;
  }

  get seoFooterText(): string {
    const ora = this.oras ? `din ${this.formatCity(this.oras)}` : 'din toată România';
    return `DentiPro listează clinicile stomatologice ${ora} care oferă servicii de ${this.serviciuLabel.toLowerCase()}. ` +
      `Compară prețuri, citește recenzii și programează-te online direct din platformă. ` +
      `Toate clinicile sunt verificate și au profiluri complete cu galerie foto, adresă exactă și număr de telefon.`;
  }

  get relatedServices(): { id: string; label: string }[] {
    return this.allServices.filter(s => s.id !== this.serviciu).slice(0, 8);
  }
}
