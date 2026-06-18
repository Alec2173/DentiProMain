import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  viewChild,
  signal,
  ViewEncapsulation,
  inject,
} from '@angular/core';

import { Map, NavigationControl, ScaleControl } from 'maplibre-gl';
import * as maplibregl from 'maplibre-gl';

import { ClinicDataService } from '../clinic-data.service';
import { DataShareService } from '../data-share.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, filter, combineLatest, debounceTime } from 'rxjs';
import { ConfigService } from '../config.service';

interface MarkerEntry {
  clinic: any;
  marker: maplibregl.Marker;
  markerEl: HTMLElement;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements OnInit, OnDestroy {
  mapElement = viewChild.required<ElementRef<HTMLDivElement>>('mapppp');

  mapSignal = signal<Map | null>(null);
  isLoading = signal(true);   // true while tiles + clinics load
  isFiltering = signal(false); // true while filter API call is in-flight
  private destroy$ = new Subject<void>();

  private allMarkers = new globalThis.Map<number, MarkerEntry>();
  private activeService = '';
  private activeMaxPrice: number | null = null;
  private moveEnd$ = new Subject<void>();

  private config = inject(ConfigService);

  constructor(
    private clinicService: ClinicDataService,
    private dataShareService: DataShareService,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    const map = new Map({
      container: this.mapElement().nativeElement,
      style:
        `https://api.maptiler.com/maps/streets-v2/style.json?key=${this.config.getMaptilerKey()}`,
      center: [26.1025, 44.4268],
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      maxBounds: [[19.8, 43.4], [30.4, 48.5]],
    });

    this.mapSignal.set(map);

    map.addControl(new NavigationControl(), 'top-right');
    map.addControl(new ScaleControl(), 'bottom-left');

    map.on('load', () => {
      map.resize();
      this.loadClinicsForViewport();
    });

    map.on('moveend', () => this.moveEnd$.next());

    // Sincronizează lista de carduri + markerele cu viewport-ul hărții
    this.moveEnd$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        const bounds = this.currentBoundsFromMap(map);
        this.dataShareService.setBounds(bounds);
        this.loadClinicsForViewport(bounds);
      });

    this.dataShareService.city$
      .pipe(takeUntil(this.destroy$), filter((c) => !!c))
      .subscribe((city) => this.flyToCity(city!));

    // Subscribe to service + maxPrice together to apply map filters
    combineLatest([
      this.dataShareService.service$,
      this.dataShareService.maxPrice$,
    ])
      .pipe(debounceTime(60), takeUntil(this.destroy$))
      .subscribe(([service, maxPrice]) => {
        this.activeService = service || '';
        this.activeMaxPrice = maxPrice;
        this.applyFilters();
      });
  }

  flyToCity(city: string) {
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(city + ', Romania')}.json?key=${this.config.getMaptilerKey()}&country=ro&limit=1&language=ro`;
    this.http.get<any>(url).subscribe((res) => {
      const feature = res.features?.[0];
      if (!feature) return;
      const [lng, lat] = feature.center;
      this.mapSignal()?.flyTo({ center: [lng, lat], zoom: 12, duration: 1400 });
    });
  }

  private currentBoundsFromMap(map: Map) {
    const b = map.getBounds();
    return {
      swLat: b.getSouth(),
      swLng: b.getWest(),
      neLat: b.getNorth(),
      neLng: b.getEast(),
    };
  }

  /** Încarcă clinicile vizibile în viewport-ul curent și reconciliază markerele
   *  (adaugă doar clinicile noi, elimină doar cele care au ieșit din viewport) —
   *  evită recrearea de la zero a tuturor markerelor la fiecare pan/zoom. */
  private loadClinicsForViewport(bounds = this.currentBoundsFromMap(this.mapSignal()!)) {
    const map = this.mapSignal();
    if (!map) return;

    this.clinicService.loadClinicsInBounds(bounds).subscribe({
      next: (clinics: any[]) => {
        this.isLoading.set(false);

        const incomingIds = new Set(clinics.map((c) => c.id));

        // Elimină markerele clinicilor care au ieșit din viewport
        for (const [id, entry] of this.allMarkers) {
          if (!incomingIds.has(id)) {
            entry.marker.remove();
            this.allMarkers.delete(id);
          }
        }

        // Adaugă markere doar pentru clinicile noi din viewport
        clinics.forEach((clinic) => {
          if (this.allMarkers.has(clinic.id)) return;

          const lat = Number(clinic.latitude);
          const lng = Number(clinic.longitude);
          if (!lat || !lng) return;

          const isPro = clinic.plan === 'pro';

          const markerEl = document.createElement('div');
          markerEl.className = 'map-marker-wrap' + (isPro ? ' map-marker-wrap--pro' : '');

          const pinEl = document.createElement('div');
          pinEl.className = 'map-pin' + (isPro ? ' map-pin--pro' : '');
          pinEl.innerHTML = isPro ? `
            <div class="map-pin__body">
              <i class="fal fa-tooth map-pin__icon map-pin__icon--pro"></i>
            </div>
            <div class="map-pin__spike map-pin__spike--pro"></div>
            <div class="map-pin__pulse map-pin__pulse--pro"></div>
          ` : `
            <div class="map-pin__body">
              <i class="fal fa-tooth map-pin__icon"></i>
            </div>
            <div class="map-pin__spike"></div>
            <div class="map-pin__pulse"></div>
          `;
          markerEl.appendChild(pinEl);

          // Conținutul popup-ului se construiește abia la prima deschidere —
          // evită construirea de HTML pentru sute de clinici niciodată deschise
          const popup = new maplibregl.Popup({
            offset: 18,
            closeButton: false,
          });
          popup.on('open', () => {
            popup.setDOMContent(this.buildPopupCard(clinic, this.activeService));
          });

          const marker = new maplibregl.Marker({ element: markerEl, anchor: 'bottom' })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);

          this.allMarkers.set(clinic.id, { clinic, marker, markerEl });
        });

        // Apply any filter that was set before clinics loaded
        if (this.activeService || this.activeMaxPrice) {
          this.applyFilters();
        }
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  /** Build the popup card HTML, optionally showing the searched service price */
  private buildPopupCard(clinic: any, serviceId: string): HTMLElement {
    const isPro = clinic.plan === 'pro';
    const card = document.createElement('div');
    card.className = 'map-popup-card' + (isPro ? ' map-popup-card--pro' : '');

    const coverImg = clinic.cover || (Array.isArray(clinic.images) && clinic.images[0]) || 'no-img.webp';
    const logoImg = clinic.logo_url || clinic.logo_path || 'no-img.webp';

    // Find price for the searched service
    let priceHtml = '';
    if (serviceId && clinic.services && clinic.services.length) {
      const normId = this.normalizeRo(serviceId);
      const svc = clinic.services.find((s: any) =>
        String(s.service_id) === serviceId ||
        (s.label && this.normalizeRo(s.label).includes(normId))
      );
      if (svc) {
        const priceStr = (svc.price_min !== null || svc.price_max !== null) ? this.formatPrice(svc) : null;
        priceHtml = `
          <div class="popup-service-price">
            <span class="material-symbols-outlined popup-price-icon">payments</span>
            <span class="popup-service-label">${svc.label ?? ''}</span>
            ${priceStr ? `<span class="popup-service-amount">${priceStr}</span>` : ''}
          </div>`;
      }
    }

    const proBadgeHtml = isPro ? `
      <div class="popup-pro-badge">
        <span class="popup-pro-shine"></span>
        <i class="fal fa-crown"></i> VIP
      </div>` : '';

    card.innerHTML = `
      ${proBadgeHtml}
      <div class="popup-image">
        <img src="${coverImg}" loading="lazy" />
      </div>
      <div class="popup-info">
        <div class="popup-header">
          <img class="popup-logo${isPro ? ' popup-logo--pro' : ''}" src="${logoImg}" />
          <span class="popup-city">${clinic.city ?? ''}</span>
        </div>
        <div class="popup-name${isPro ? ' popup-name--pro' : ''}">${clinic.name ?? ''}</div>
        ${priceHtml}
        <div class="popup-footer">
          <span class="popup-rating"><span class="material-symbols-outlined popup-star">star</span> ${clinic.avg_rating ? Number(clinic.avg_rating).toFixed(1) : '—'}</span>
          <span class="popup-cta${isPro ? ' popup-cta--pro' : ''}">
            Vezi profil
            <span class="material-symbols-outlined popup-cta-arrow">arrow_forward</span>
          </span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      this.router.navigate(['/descripton', clinic.id]);
    });

    return card;
  }

  private formatPrice(svc: any): string {
    const min = svc.price_min;
    const max = svc.price_max;
    const type = svc.price_type;

    if (min !== null && max !== null && min !== max) {
      return `${min} – ${max} lei`;
    }
    if (type === 'from' && min !== null) {
      return `de la ${min} lei`;
    }
    if (min !== null) return `${min} lei`;
    if (max !== null) return `${max} lei`;
    return '';
  }

  /** Show/hide markers using backend filter (same logic as cards) — scoped to current viewport */
  private applyFilters() {
    const service = this.activeService;
    const maxPrice = this.activeMaxPrice;

    if (!service && !maxPrice) {
      // No filter — show all; rebuild popup content only if currently open
      this.allMarkers.forEach(({ clinic, marker, markerEl }) => {
        markerEl.style.display = '';
        const popup = marker.getPopup();
        if (popup?.isOpen()) popup.setDOMContent(this.buildPopupCard(clinic, ''));
      });
      return;
    }

    // Don't filter if clinics haven't loaded yet
    if (this.allMarkers.size === 0) return;

    const map = this.mapSignal();
    if (!map) return;

    this.isFiltering.set(true);

    const bounds = this.currentBoundsFromMap(map);
    let url = `https://www.dentipro.ro/api/clinics?mode=map&swLat=${bounds.swLat}&swLng=${bounds.swLng}&neLat=${bounds.neLat}&neLng=${bounds.neLng}`;
    if (service) url += `&service=${encodeURIComponent(service)}`;
    if (maxPrice) url += `&maxPrice=${maxPrice}`;

    this.http.get<any[]>(url).subscribe({
      next: (filtered) => {
        this.isFiltering.set(false);
        const visibleIds = new Set(filtered.map((c: any) => c.id));
        this.allMarkers.forEach(({ clinic, marker, markerEl }) => {
          const visible = visibleIds.has(clinic.id);
          markerEl.style.display = visible ? '' : 'none';
          if (visible) {
            // Actualizează datele clinicii (preț proaspăt) — popup-ul le va
            // folosi fie acum (dacă e deja deschis), fie lazy la următoarea deschidere
            const fresh = filtered.find((c: any) => c.id === clinic.id);
            if (fresh) Object.assign(clinic, fresh);
            const popup = marker.getPopup();
            if (popup?.isOpen()) popup.setDOMContent(this.buildPopupCard(clinic, service));
          }
        });
      },
      error: () => {
        this.isFiltering.set(false);
        this.allMarkers.forEach(({ markerEl }) => { markerEl.style.display = ''; });
      }
    });
  }

  /** Normalize Romanian diacritics for robust slug-vs-label matching */
  private normalizeRo(s: string): string {
    return s.toLowerCase()
      .replace(/[ăâ]/g, 'a')
      .replace(/î/g, 'i')
      .replace(/[șş]/g, 's')
      .replace(/[țţ]/g, 't');
  }

  private readonly RO_CITIES: { name: string; lat: number; lng: number }[] = [
    { name: 'București',           lat: 44.4396, lng: 26.0979 },
    { name: 'Cluj-Napoca',         lat: 46.7712, lng: 23.6236 },
    { name: 'Timișoara',           lat: 45.7489, lng: 21.2087 },
    { name: 'Iași',                lat: 47.1585, lng: 27.6014 },
    { name: 'Constanța',           lat: 44.1598, lng: 28.6348 },
    { name: 'Craiova',             lat: 44.3302, lng: 23.7949 },
    { name: 'Brașov',              lat: 45.6427, lng: 25.5887 },
    { name: 'Galați',              lat: 45.4353, lng: 28.0080 },
    { name: 'Ploiești',            lat: 44.9365, lng: 26.0438 },
    { name: 'Oradea',              lat: 47.0465, lng: 21.9189 },
    { name: 'Sibiu',               lat: 45.7983, lng: 24.1256 },
    { name: 'Bacău',               lat: 46.5670, lng: 26.9146 },
    { name: 'Arad',                lat: 46.1866, lng: 21.3123 },
    { name: 'Pitești',             lat: 44.8565, lng: 24.8691 },
    { name: 'Târgu Mureș',         lat: 46.5422, lng: 24.5575 },
    { name: 'Baia Mare',           lat: 47.6573, lng: 23.5684 },
    { name: 'Buzău',               lat: 45.1500, lng: 26.8200 },
    { name: 'Botoșani',            lat: 47.7487, lng: 26.6694 },
    { name: 'Satu Mare',           lat: 47.7914, lng: 22.8850 },
    { name: 'Râmnicu Vâlcea',      lat: 45.1043, lng: 24.3693 },
    { name: 'Suceava',             lat: 47.6514, lng: 26.2556 },
    { name: 'Drobeta-Turnu Severin', lat: 44.6294, lng: 22.6566 },
    { name: 'Târgoviște',          lat: 44.9255, lng: 25.4569 },
    { name: 'Focșani',             lat: 45.6988, lng: 27.1856 },
    { name: 'Bistrița',            lat: 47.1333, lng: 24.5000 },
    { name: 'Reșița',              lat: 45.2952, lng: 21.8889 },
    { name: 'Deva',                lat: 45.8786, lng: 22.9114 },
    { name: 'Alba Iulia',          lat: 46.0680, lng: 23.5704 },
    { name: 'Slobozia',            lat: 44.5637, lng: 27.3685 },
    { name: 'Alexandria',          lat: 43.9767, lng: 25.3339 },
  ];

  /** Găsește cel mai apropiat oraș față de coordonatele date (km) */
  private nearestCity(lat: number, lng: number): string | null {
    let best: string | null = null;
    let bestDist = Infinity;
    for (const c of this.RO_CITIES) {
      const dLat = (c.lat - lat) * Math.PI / 180;
      const dLng = (c.lng - lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180)*Math.cos(c.lat*Math.PI/180)*Math.sin(dLng/2)**2;
      const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      if (dist < bestDist) { bestDist = dist; best = c.name; }
    }
    // Ignoră dacă centrul e prea departe de orice oraș (>80km)
    return bestDist < 80 ? best : null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.moveEnd$.complete();
    this.mapSignal()?.remove();
  }
}
