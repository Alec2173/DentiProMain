import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClinicDataService } from '../clinic-data.service';
import { ServiciiService } from '../servicii.service';
import { SeoService } from '../seo.service';
import { DataShareService } from '../data-share.service';

@Component({
  selector: 'app-clinic-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
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
  maxPrice: number | null = null;
  serviciuLabel = '';

  private offset = 0;
  private readonly PAGE_SIZE = 24;

  readonly allServices: { id: string; label: string }[];

  readonly cities = [
    'București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța',
    'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Oradea',
    'Sibiu', 'Bacău', 'Arad', 'Pitești', 'Baia Mare',
    'Buzău', 'Botoșani', 'Satu Mare', 'Râmnicu Vâlcea', 'Suceava',
  ];

  readonly priceRanges = [
    { label: 'Orice preț',    value: null },
    { label: 'Sub 200 lei',   value: 200 },
    { label: 'Sub 500 lei',   value: 500 },
    { label: 'Sub 1.000 lei', value: 1000 },
    { label: 'Sub 2.500 lei', value: 2500 },
    { label: 'Sub 5.000 lei', value: 5000 },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clinicData: ClinicDataService,
    private serviciiService: ServiciiService,
    private seo: SeoService,
    private dataShare: DataShareService,
  ) {
    this.allServices = this.serviciiService.getServices();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.serviciu = params.get('serviciu') || '';
      this.oras = params.get('oras') || '';
      this.serviciuLabel = this.allServices.find(s => s.id === this.serviciu)?.label || '';
      this.clinics = [];
      this.offset = 0;
      this.load(true);
      this.setSeo();
    });
  }

  onServiceChange(newService: string) {
    const parts: any[] = newService ? ['/dentisti', newService] : ['/dentisti'];
    if (newService && this.oras) parts.push(this.cityToSlug(this.oras));
    this.router.navigate(parts);
  }

  onCityChange(newCity: string) {
    if (newCity && this.serviciu) {
      this.router.navigate(['/dentisti', this.serviciu, this.cityToSlug(newCity)]);
    } else if (this.serviciu) {
      this.router.navigate(['/dentisti', this.serviciu]);
    } else {
      this.router.navigate(['/dentisti']);
    }
  }

  onMaxPriceChange(val: number | null) {
    this.maxPrice = val;
    this.clinics = [];
    this.offset = 0;
    this.load(true);
  }

  clearFilters() {
    this.maxPrice = null;
    this.router.navigate(this.serviciu ? ['/dentisti', this.serviciu] : ['/dentisti']);
  }

  goToFinder() {
    const queryParams: Record<string, any> = {};
    if (this.serviciu) queryParams['service'] = this.serviciu;

    // Recover diacritics-correct city name from slug by matching cities list
    if (this.oras) {
      const match = this.cities.find(c => this.cityToSlug(c) === this.oras);
      queryParams['city'] = match || this.cityDisplay;
    }

    // maxPrice: pass as query param AND set directly in DataShareService
    // (finder only reads city+service from params, not maxPrice)
    if (this.maxPrice !== null) {
      queryParams['maxPrice'] = this.maxPrice;
      this.dataShare.setMaxPrice(this.maxPrice);
    }

    this.router.navigate(['/finder'], { queryParams });
  }

  get activeFiltersCount(): number {
    let n = 0;
    if (this.oras) n++;
    if (this.maxPrice !== null) n++;
    return n;
  }

  private load(initial = false) {
    if (initial) this.isLoading = true;
    else this.isLoadingMore = true;

    this.clinicData.loadPage({
      limit: this.PAGE_SIZE,
      offset: this.offset,
      city: this.oras ? this.formatCity(this.oras) : undefined,
      service: this.serviciu || undefined,
      maxPrice: this.maxPrice,
    }).subscribe({
      next: (page) => {
        const parsed = this.parseClinics(page.clinics);
        this.clinics = initial ? parsed : [...this.clinics, ...parsed];
        this.total = page.total;
        this.hasMore = page.hasMore;
        this.offset += parsed.length;
        this.isLoading = false;
        this.isLoadingMore = false;
        // Re-emit schema with actual clinic data after first page loads
        if (initial) this.setSeo();
      },
      error: () => {
        this.isLoading = false;
        this.isLoadingMore = false;
      },
    });
  }

  private parseClinics(data: any[]): any[] {
    const planRank = (p: string) => p === 'pro' ? 0 : p === 'growth' ? 1 : 2;
    return data
      .map(c => {
        let images: string[] = [];
        if (Array.isArray(c.images) && c.images.length > 0) {
          images = c.images;
        } else if (typeof c.clinic_images === 'string') {
          try { images = JSON.parse(c.clinic_images || '[]'); } catch { images = []; }
        }
        return { ...c, images, logo_url: c.logo_url || c.logo_path || null };
      })
      .sort((a, b) => planRank(a.plan) - planRank(b.plan));
  }

  loadMore() {
    if (!this.hasMore || this.isLoadingMore) return;
    this.load(false);
  }

  private cityToSlug(city: string): string {
    return city.toLowerCase()
      .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i')
      .replace(/ș|ş/g, 's').replace(/ț|ţ/g, 't')
      .replace(/\s+/g, '-');
  }

  formatCity(slug: string): string {
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  get cityDisplay(): string {
    return this.oras ? this.formatCity(this.oras) : '';
  }

  get h1(): string {
    const orasDisplay = this.oras ? ` în ${this.formatCity(this.oras)}` : ' în România';
    const svc = this.serviciuLabel || 'Toate clinicile';
    return `${svc}${orasDisplay}`;
  }

  getServicePrice(clinic: any): string {
    const s = clinic.services?.find((sv: any) => sv.service_id === this.serviciu);
    if (!s || s.price_min == null) return '';
    if (s.price_type === 'range' && s.price_max != null) return `${s.price_min}–${s.price_max} lei`;
    return `de la ${s.price_min} lei`;
  }

  get seoFooterText(): string {
    const ora = this.oras ? `din ${this.formatCity(this.oras)}` : 'din toată România';
    return `DentiPro listează clinicile stomatologice ${ora} care oferă servicii de ${this.serviciuLabel.toLowerCase()}. ` +
      `Compară prețuri, citește recenzii și programează-te online direct din platformă. ` +
      `Toate clinicile sunt verificate și au profiluri complete cu galerie foto, adresă exactă și număr de telefon.`;
  }

  get relatedServices(): { id: string; label: string }[] {
    return this.allServices.filter(s => s.id !== this.serviciu).slice(0, 12);
  }

  private setSeo() {
    const orasDisplay = this.oras ? ` în ${this.formatCity(this.oras)}` : ' în România';
    const svcLabel = this.serviciuLabel || 'Clinici stomatologice';
    const title = `${svcLabel}${orasDisplay} | DentiPro`;
    const desc = this.serviciu
      ? `Găsește clinici stomatologice pentru ${svcLabel.toLowerCase()}${orasDisplay}. Prețuri, galerie foto, recenzii și programare online.`
      : `Toate clinicile stomatologice${orasDisplay}. Compară prețuri, citește recenzii și programează-te online pe DentiPro.`;
    const canonical = `https://dentipro.ro/dentisti${this.serviciu ? '/' + this.serviciu : ''}${this.oras ? '/' + this.oras : ''}`;

    const breadcrumbItems: any[] = [
      { '@type': 'ListItem', position: 1, name: 'Acasă', item: 'https://dentipro.ro/' },
      { '@type': 'ListItem', position: 2, name: 'Dentiști', item: 'https://dentipro.ro/dentisti' },
    ];
    if (this.serviciu) {
      breadcrumbItems.push({
        '@type': 'ListItem', position: 3,
        name: svcLabel,
        item: `https://dentipro.ro/dentisti/${this.serviciu}`,
      });
    }
    if (this.oras) {
      breadcrumbItems.push({
        '@type': 'ListItem', position: breadcrumbItems.length + 1,
        name: this.formatCity(this.oras),
        item: canonical,
      });
    }

    this.seo.set({
      title, description: desc, canonical,
      schema: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbItems,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: title,
          description: desc,
          url: canonical,
          itemListElement: this.clinics.slice(0, 10).map((c: any, i: number) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Dentist',
              name: c.name,
              ...(c.city ? { address: { '@type': 'PostalAddress', addressLocality: c.city, addressCountry: 'RO' } } : {}),
              ...(c.avg_rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: c.avg_rating, reviewCount: c.review_count ?? 1 } } : {}),
              url: `https://dentipro.ro/clinic-profile/${c.id}`,
            },
          })),
        },
      ] as any,
    });
  }
}
