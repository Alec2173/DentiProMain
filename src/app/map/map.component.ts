import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  viewChild,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { Map, NavigationControl, ScaleControl } from 'maplibre-gl';
import * as maplibregl from 'maplibre-gl';

import { ClinicDataService } from '../clinic-data.service';
import { DataShareService } from '../data-share.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, filter, combineLatest } from 'rxjs';

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

  private allMarkers: MarkerEntry[] = [];
  private activeService = '';
  private activeMaxPrice: number | null = null;

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
        'https://api.maptiler.com/maps/streets-v2/style.json?key=cwyGOMCDF8zwmBEDJrCr',
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
      this.loadClinics();
    });

    this.dataShareService.city$
      .pipe(takeUntil(this.destroy$), filter((c) => !!c))
      .subscribe((city) => this.flyToCity(city!));

    // Subscribe to service + maxPrice together to apply map filters
    combineLatest([
      this.dataShareService.service$,
      this.dataShareService.maxPrice$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([service, maxPrice]) => {
        this.activeService = service || '';
        this.activeMaxPrice = maxPrice;
        this.applyFilters();
      });
  }

  flyToCity(city: string) {
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(city + ', Romania')}.json?key=cwyGOMCDF8zwmBEDJrCr&country=ro&limit=1&language=ro`;
    this.http.get<any>(url).subscribe((res) => {
      const feature = res.features?.[0];
      if (!feature) return;
      const [lng, lat] = feature.center;
      this.mapSignal()?.flyTo({ center: [lng, lat], zoom: 12, duration: 1400 });
    });
  }

  loadClinics() {
    const map = this.mapSignal();
    if (!map) return;

    this.clinicService.loadClinicsAuto().subscribe({
      next: (clinics: any[]) => {
        this.isLoading.set(false);
        clinics.forEach((clinic) => {
          const lat = Number(clinic.latitude);
          const lng = Number(clinic.longitude);
          if (!lat || !lng) return;

          const markerEl = document.createElement('div');
          markerEl.className = 'map-marker-wrap';

          const pinEl = document.createElement('div');
          pinEl.className = 'map-pin';
          pinEl.innerHTML = `
            <div class="map-pin__body">
              <i class="fal fa-tooth map-pin__icon"></i>
            </div>
            <div class="map-pin__spike"></div>
            <div class="map-pin__pulse"></div>
          `;
          markerEl.appendChild(pinEl);

          const card = this.buildPopupCard(clinic, this.activeService);

          const popup = new maplibregl.Popup({
            offset: 18,
            closeButton: false,
          }).setDOMContent(card);

          const marker = new maplibregl.Marker({ element: markerEl, anchor: 'bottom' })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);

          this.allMarkers.push({ clinic, marker, markerEl });
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
    const card = document.createElement('div');
    card.className = 'map-popup-card';

    const coverImg = clinic.cover || (Array.isArray(clinic.images) && clinic.images[0]) || 'no-img.jpg';
    const logoImg = clinic.logo_url || clinic.logo_path || 'no-img.jpg';

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

    card.innerHTML = `
      <div class="popup-image">
        <img src="${coverImg}" loading="lazy" />
      </div>
      <div class="popup-info">
        <div class="popup-header">
          <img class="popup-logo" src="${logoImg}" />
          <span class="popup-city">${clinic.city ?? ''}</span>
        </div>
        <div class="popup-name">${clinic.name ?? ''}</div>
        ${priceHtml}
        <div class="popup-footer">
          <span class="popup-rating"><span class="material-symbols-outlined popup-star">star</span> ${clinic.avg_rating ? Number(clinic.avg_rating).toFixed(1) : '—'}</span>
          <span class="popup-cta">
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

  /** Show/hide markers using backend filter (same logic as cards) */
  private applyFilters() {
    const service = this.activeService;
    const maxPrice = this.activeMaxPrice;

    if (!service && !maxPrice) {
      // No filter — show all, rebuild popups without price
      this.allMarkers.forEach(({ clinic, marker, markerEl }) => {
        markerEl.style.display = '';
        marker.getPopup()?.setDOMContent(this.buildPopupCard(clinic, ''));
      });
      return;
    }

    // Don't filter if clinics haven't loaded yet
    if (this.allMarkers.length === 0) return;

    this.isFiltering.set(true);

    // Ask backend for matching clinic IDs (same filter as cards)
    let url = `https://www.dentipro.ro/api/clinics?mode=map`;
    if (service) url += `&service=${encodeURIComponent(service)}`;
    if (maxPrice) url += `&maxPrice=${maxPrice}`;

    this.http.get<any[]>(url).subscribe({
      next: (filtered) => {
        this.isFiltering.set(false);
        const visibleIds = new Set(filtered.map((c: any) => c.id));
        this.allMarkers.forEach(({ clinic, marker, markerEl }) => {
          const visible = visibleIds.has(clinic.id);
          markerEl.style.display = visible ? '' : 'none';
          if (visible && service) {
            const fresh = filtered.find((c: any) => c.id === clinic.id) ?? clinic;
            const newCard = this.buildPopupCard(fresh, service);
            marker.getPopup()?.setDOMContent(newCard);
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.mapSignal()?.remove();
  }
}
