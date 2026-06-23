import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SeoService } from '../seo.service';

const API = '/api';

const CITY_META: Record<string, { desc: string; longDesc: string }> = {
  'bucuresti': {
    desc: 'Găsește cele mai bune clinici stomatologice din București. Compară prețuri, citește recenzii reale și programează-te online.',
    longDesc: 'Bucureștiul are una dintre cele mai dense rețele de clinici stomatologice din România. De la implanturi și estetică dentară la ortodonție și chirurgie, găsești pe DentiPro clinici verificate din toate sectoarele capitalei — cu prețuri transparente, galerii foto și recenzii reale de la pacienți.',
  },
  'cluj-napoca': {
    desc: 'Clinici stomatologice Cluj-Napoca — prețuri, recenzii și programare online. DentiPro listează cabinetele dentare de top din Cluj.',
    longDesc: 'Cluj-Napoca este recunoscut pentru standardele ridicate ale serviciilor medicale. Pe DentiPro găsești clinici stomatologice din centrul Clujului și din cartierele rezidențiale, cu servicii de implanturi, ortodonție cu aparate clare și tratamente de estetică dentară.',
  },
  'timisoara': {
    desc: 'Clinici stomatologice Timișoara — compară servicii, prețuri și recenzii. Programare online rapidă pe DentiPro.',
    longDesc: 'Timișoara concentrează clinici stomatologice moderne care oferă servicii la standarde europene. Găsești pe DentiPro cabinete specializate în implanturi dentare, aparate dentare invizibile și tratamente de albire, cu programare online disponibilă.',
  },
  'iasi': {
    desc: 'Clinici stomatologice Iași — prețuri accesibile, recenzii reale, programare online. Găsești pe DentiPro clinicile dentare din Iași.',
    longDesc: 'Iașul dispune de o rețea solidă de clinici stomatologice, de la cabinete de cartier la centre dentare multidisciplinare. DentiPro listează clinicile din Iași cu prețuri transparente și posibilitate de programare online.',
  },
  'brasov': {
    desc: 'Clinici stomatologice Brașov — compară oferte, recenzii și prețuri. Programare online la cei mai buni dentiști din Brașov.',
    longDesc: 'Brașovul are clinici stomatologice moderne atât în centrul orașului cât și în cartierele rezidențiale. Pe DentiPro găsești cabinete cu servicii complete — de la consultații de rutină la implanturi, fațete și aparate dentare clare.',
  },
  'constanta': {
    desc: 'Clinici stomatologice Constanța — prețuri, recenzii și programare online. Găsește dentistul potrivit în Constanța pe DentiPro.',
    longDesc: 'Constanța concentrează clinici stomatologice cu servicii variate, de la tratamente de urgență la estetică dentară și implanturi. Pe DentiPro găsești cabinete din centrul orașului și din cartierele rezidențiale, cu prețuri transparente și recenzii reale.',
  },
  'craiova': {
    desc: 'Clinici stomatologice Craiova — compară prețuri și recenzii. Programare online rapidă la dentiști din Craiova pe DentiPro.',
    longDesc: 'Craiova are o rețea în creștere de clinici stomatologice moderne, cu servicii de implantologie, ortodonție și estetică dentară. Pe DentiPro găsești clinici verificate din Craiova cu prețuri transparente și posibilitate de programare online.',
  },
  'galati': {
    desc: 'Clinici stomatologice Galați — prețuri accesibile, recenzii reale. Programare online la clinici dentare din Galați.',
    longDesc: 'Galațiul dispune de clinici stomatologice cu servicii complete, de la detartraj și plombe până la implanturi și aparate dentare. DentiPro listează cabinetele din Galați cu prețuri transparente și recenzii verificate.',
  },
  'ploiesti': {
    desc: 'Clinici stomatologice Ploiești — prețuri, recenzii și programare online. Găsește cel mai bun dentist din Ploiești pe DentiPro.',
    longDesc: 'Ploieștiul oferă acces la clinici stomatologice moderne atât în centru cât și în zonele rezidențiale. Pe DentiPro găsești cabinete cu servicii de implantologie, albire dentară și orthodonție, cu programare online disponibilă.',
  },
  'oradea': {
    desc: 'Clinici stomatologice Oradea — recenzii reale, prețuri transparente. Programare online la dentiști din Oradea pe DentiPro.',
    longDesc: 'Oradea este recunoscută pentru turismul medical stomatologic, cu clinici care oferă servicii de calitate la prețuri competitive. Pe DentiPro găsești clinici din Oradea verificate, cu galerii foto și recenzii de la pacienți reali.',
  },
  'sibiu': {
    desc: 'Clinici stomatologice Sibiu — prețuri, recenzii și programare online. DentiPro listează cabinetele dentare de top din Sibiu.',
    longDesc: 'Sibiul are o ofertă diversă de clinici stomatologice, de la cabinete individuale la centre dentare multidisciplinare. Pe DentiPro găsești clinici din Sibiu cu servicii de implantologie, estetică dentară și ortodonție, cu prețuri transparente.',
  },
  'arad': {
    desc: 'Clinici stomatologice Arad — compară oferte, prețuri și recenzii. Programare online rapidă la dentist în Arad pe DentiPro.',
    longDesc: 'Aradul beneficiază de clinici stomatologice moderne, multe cu echipamente de ultimă generație. Pe DentiPro găsești cabinete din Arad cu servicii variate — de la tratamente de rutină la implanturi și fațete ceramice.',
  },
  'targu-mures': {
    desc: 'Clinici stomatologice Târgu Mureș — prețuri, recenzii și programare online. Găsește dentistul potrivit în Târgu Mureș.',
    longDesc: 'Târgu Mureșul, cu tradiție medicală puternică, oferă o varietate de clinici stomatologice de calitate. Pe DentiPro găsești cabinete verificate din Târgu Mureș cu servicii complete și prețuri transparente.',
  },
  'baia-mare': {
    desc: 'Clinici stomatologice Baia Mare — recenzii reale și programare online. Găsește cel mai bun dentist din Baia Mare pe DentiPro.',
    longDesc: 'Baia Mare dispune de clinici stomatologice cu servicii moderne, inclusiv implantologie și ortodonție. DentiPro listează cabinetele din Baia Mare cu prețuri transparente și recenzii de la pacienți reali.',
  },
  'buzau': {
    desc: 'Clinici stomatologice Buzău — prețuri accesibile și programare online. Găsește clinici dentare verificate din Buzău pe DentiPro.',
    longDesc: 'Buzăul are clinici stomatologice accesibile cu servicii de calitate, de la consultații și tratamente de bază până la implanturi și estetică dentară. Pe DentiPro găsești cabinetele din Buzău cu recenzii reale.',
  },
  'bacau': {
    desc: 'Clinici stomatologice Bacău — prețuri, recenzii și programare online. DentiPro listează dentiștii de top din Bacău.',
    longDesc: 'Bacăul oferă acces la clinici stomatologice moderne atât în centrul orașului cât și în cartierele periferice. Pe DentiPro găsești cabinete din Bacău cu servicii complete — de la detartraj și plombe la implanturi și aparate dentare.',
  },
};

@Component({
  selector: 'app-city-seo',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './city-seo.component.html',
  styleUrl: './city-seo.component.css',
})
export class CitySeoComponent implements OnInit {
  slug = '';
  cityData: any = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private seo: SeoService,
  ) {}

  ngOnInit() {
    this.slug = this.route.snapshot.data['citySlug'] ?? '';
    this.load();
  }

  private load() {
    this.http.get<any>(`${API}/seo/city/${this.slug}`).subscribe({
      next: (data) => {
        this.cityData = data;
        this.isLoading = false;
        this.setSeo(data);
      },
      error: () => { this.isLoading = false; },
    });
  }

  private setSeo(data: any) {
    const city = data.city as string;
    const meta = CITY_META[this.slug] ?? {
      desc: `Găsește clinici stomatologice în ${city}. Prețuri, recenzii și programare online pe DentiPro.`,
      longDesc: `DentiPro listează clinicile stomatologice din ${city} cu prețuri transparente și programare online.`,
    };
    const title = `Clinici stomatologice ${city} — Prețuri și Programare Online | DentiPro`;
    const canonical = `https://dentipro.ro/dentisti/${this.slug}`;

    this.seo.set({
      title,
      description: meta.desc,
      canonical,
      schema: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Acasă', item: 'https://dentipro.ro/' },
            { '@type': 'ListItem', position: 2, name: 'Dentiști', item: 'https://dentipro.ro/dentisti' },
            { '@type': 'ListItem', position: 3, name: `Dentiști ${city}`, item: canonical },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Clinici stomatologice ${city}`,
          description: meta.desc,
          url: canonical,
          numberOfItems: data.clinicCount,
          itemListElement: (data.topClinics ?? []).map((c: any, i: number) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Dentist',
              name: c.name,
              address: { '@type': 'PostalAddress', addressLocality: city, addressCountry: 'RO' },
              ...(c.avg_rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: c.avg_rating, reviewCount: c.review_count ?? 1 } } : {}),
              url: `https://dentipro.ro/clinic-profile/${c.id}`,
            },
          })),
        },
      ] as any,
    });
  }

  get cityName(): string { return this.cityData?.city ?? ''; }
  get clinicCount(): number { return this.cityData?.clinicCount ?? 0; }
  get topClinics(): any[] { return this.cityData?.topClinics ?? []; }
  get keyServices(): any[] { return this.cityData?.keyServices ?? []; }

  get longDesc(): string {
    return CITY_META[this.slug]?.longDesc ?? `DentiPro listează clinicile stomatologice din ${this.cityName} cu prețuri transparente și programare online.`;
  }

  planBadge(plan: string): string {
    if (plan === 'pro') return '★ VIP';
    if (plan === 'growth') return 'Promovat';
    return '';
  }

  formatPrice(n: number): string {
    return n ? n.toLocaleString('ro-RO') + ' lei' : '—';
  }
}
