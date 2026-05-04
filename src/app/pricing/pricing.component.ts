import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  ElementRef,
  viewChild,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SeoService } from '../seo.service';
import { ConfigService } from '../config.service';
import { AuthService } from '../auth.service';
import { PlanCardComponent } from './plan-card/plan-card.component';
import { PLANS, PAID_PLANS_ENABLED } from './plan.model';
import { Map as MapGL, NavigationControl } from 'maplibre-gl';
import * as maplibregl from 'maplibre-gl';

const API = 'https://www.dentipro.ro/api';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [RouterLink, PlanCardComponent],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css',
})
export class PricingComponent implements OnInit, AfterViewInit, OnDestroy {
  private seo    = inject(SeoService);
  private route  = inject(ActivatedRoute);
  private config = inject(ConfigService);
  private http   = inject(HttpClient);
  public auth    = inject(AuthService);

  billingAnnual = false;
  readonly plans = PAID_PLANS_ENABLED ? PLANS : PLANS.filter(p => p.id === 'starter');

  demoMapEl = viewChild<ElementRef<HTMLDivElement>>('demoMapEl');
  private demoMap: MapGL | null = null;

  // ── CITY STATS ──────────────────────────────────────────
  cityCompetitorCount = 0;
  cityCompetitorCity = '';
  cityStatsLoaded = false;

  readonly faqs = [
    {
      q: 'Pot anula oricând?',
      a: 'Da, complet. Nu există contracte pe termen lung sau penalități de anulare. Anulezi din dashboard-ul tău în orice moment — accesul rămâne activ până la finalul perioadei deja plătite.',
    },
    {
      q: 'Ce se întâmplă cu profilul dacă anulez?',
      a: 'Profilul rămâne activ pe Starter gratuit — nu pierzi datele, fotografiile sau recenziile. Pierzi doar avantajele planului plătit (prioritate în căutări, badge, statistici etc.).',
    },
    {
      q: 'Există perioadă de probă?',
      a: 'Planul Starter este permanent gratuit. Pentru Growth și Pro îți oferim 14 zile de trial fără card bancar — testezi toate funcțiile înainte să decizi.',
    },
    {
      q: 'Pot schimba planul oricând?',
      a: 'Da. Upgrade-ul se face imediat și schimbarea intră în vigoare în câteva secunde. Downgrade-ul se aplică la finalul perioadei curente.',
    },
    {
      q: 'Cum funcționează plata? Ce metode acceptați?',
      a: 'Plata se procesează securizat prin Stripe — Visa, Mastercard și American Express. Factura este generată automat lunar sau anual și trimisă pe email.',
    },
  ];

  openFaq: number | null = null;

  ngOnInit() {
    this.seo.set({
      title: 'Prețuri clinici dentare — Starter gratuit, Growth, Pro | DentiPro',
      description: 'Alege planul potrivit pentru clinica ta. Starter gratuit, Growth 79 RON/lună, Pro 149 RON/lună. Apari primul în căutări, primești programări online și statistici reale.',
      canonical: 'https://dentipro.ro/clinici/pricing',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: this.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      },
    });

    // Load city competitor count (national — no city on AuthUser)
    this.http.get<{ count: number; city: string | null }>(`${API}/pricing/city-stats`).subscribe({
      next: (data) => {
        this.cityCompetitorCount = data.count;
        this.cityCompetitorCity = data.city || '';
        this.cityStatsLoaded = true;
      },
      error: () => { this.cityStatsLoaded = true; },
    });
  }

  ngAfterViewInit() {
    const el = this.demoMapEl()?.nativeElement;
    if (!el) return;

    const map = new MapGL({
      container: el,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${this.config.getMaptilerKey()}`,
      center: [26.0979, 44.4396],
      zoom: 14,
      minZoom: 10,
      maxZoom: 18,
    });

    this.demoMap = map;
    map.addControl(new NavigationControl(), 'top-right');

    map.on('load', () => {
      map.resize();

      const regularCoords: [number, number][] = [
        [26.082, 44.442],
        [26.112, 44.448],
        [26.088, 44.428],
        [26.108, 44.432],
      ];

      regularCoords.forEach((lngLat) => {
        const wrapEl = document.createElement('div');
        wrapEl.className = 'map-marker-wrap';
        const pin = document.createElement('div');
        pin.className = 'map-pin';
        pin.innerHTML = `<div class="map-pin__body"><i class="fal fa-tooth map-pin__icon"></i></div><div class="map-pin__spike"></div><div class="map-pin__pulse"></div>`;
        wrapEl.appendChild(pin);
        new maplibregl.Marker({ element: wrapEl, anchor: 'bottom' }).setLngLat(lngLat).addTo(map);
      });

      const markerEl = document.createElement('div');
      markerEl.className = 'map-marker-wrap map-marker-wrap--pro';
      const pinEl = document.createElement('div');
      pinEl.className = 'map-pin map-pin--pro';
      pinEl.innerHTML = `<div class="map-pin__body"><i class="fal fa-tooth map-pin__icon map-pin__icon--pro"></i></div><div class="map-pin__spike map-pin__spike--pro"></div><div class="map-pin__pulse map-pin__pulse--pro"></div>`;
      markerEl.appendChild(pinEl);

      const card = document.createElement('div');
      card.className = 'map-popup-card map-popup-card--pro';
      card.innerHTML = `
        <div class="popup-pro-badge"><span class="popup-pro-shine"></span><i class="fal fa-crown"></i> VIP</div>
        <div class="popup-image"><img src="no-img.jpg" loading="lazy" alt="Exemplu clinică" /></div>
        <div class="popup-info">
          <div class="popup-header"><img class="popup-logo popup-logo--pro" src="no-img.jpg" alt="Logo" /><span class="popup-city">București</span></div>
          <div class="popup-name popup-name--pro">Exemplu</div>
          <div class="popup-footer">
            <span class="popup-rating"><span class="material-symbols-outlined popup-star">star</span>5.0</span>
            <span class="popup-cta">Vezi profil<span class="material-symbols-outlined popup-cta-arrow">arrow_forward</span></span>
          </div>
        </div>`;

      const popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setDOMContent(card);
      const marker = new maplibregl.Marker({ element: markerEl, anchor: 'bottom' }).setLngLat([26.0979, 44.4396]).setPopup(popup).addTo(map);
      marker.togglePopup();
    });
  }

  ngOnDestroy() {
    this.demoMap?.remove();
  }

  toggleBilling() { this.billingAnnual = !this.billingAnnual; }
  toggleFaq(index: number) { this.openFaq = this.openFaq === index ? null : index; }

  get competitorLine(): string {
    if (!this.cityStatsLoaded || this.cityCompetitorCount === 0) return '';
    const loc = this.cityCompetitorCity ? `din ${this.cityCompetitorCity}` : 'din România';
    return `${this.cityCompetitorCount} ${this.cityCompetitorCount === 1 ? 'clinică' : 'clinici'} ${loc} ${this.cityCompetitorCount === 1 ? 'apare' : 'apar'} deja înaintea ta pe Growth sau Pro.`;
  }
}
