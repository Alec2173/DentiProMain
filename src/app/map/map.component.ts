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
import { Subject, takeUntil, filter } from 'rxjs';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements OnInit, OnDestroy {
  mapElement = viewChild.required<ElementRef<HTMLDivElement>>('mapppp');

  mapSignal = signal<Map | null>(null);
  private destroy$ = new Subject<void>();

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
        clinics.forEach((clinic) => {
          const lat = Number(clinic.latitude);
          const lng = Number(clinic.longitude);

          if (!lat || !lng) return;

          /* ---------------- CREATE POPUP CARD ---------------- */

          const card = document.createElement('div');
          card.className = 'map-popup-card';

          // Parse images
          let images: string[] = [];
          if (Array.isArray(clinic.images) && clinic.images.length > 0) {
            images = clinic.images;
          } else if (typeof clinic.clinic_images === 'string') {
            try { images = JSON.parse(clinic.clinic_images || '[]'); } catch {}
          }
          const coverImg = images.length > 0 ? images[0] : 'no-img.jpg';
          const logoImg = clinic.logo_url || clinic.logo_path || 'no-img.jpg';

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
              <div class="popup-footer">
                <span class="popup-rating"><span class="material-symbols-outlined popup-star">star</span> 4.5</span>
                <span class="popup-cta">
                  Vezi profil
                  <span class="material-symbols-outlined popup-cta-arrow">arrow_forward</span>
                </span>
              </div>
            </div>
          `;

          /* ---------------- CLICK NAVIGATION ---------------- */

          card.addEventListener('click', () => {
            this.router.navigate(['/descripton', clinic.id]);
          });

          /* ---------------- POPUP ---------------- */

          const popup = new maplibregl.Popup({
            offset: 18,
            closeButton: false,
          }).setDOMContent(card);

          /* ---------------- MARKER ---------------- */

          // Outer wrapper: MapLibre applies position transform here (no CSS transition on it)
          const markerEl = document.createElement('div');
          markerEl.className = 'map-marker-wrap';

          // Inner visual: safe to transition on hover without interfering with MapLibre
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

          new maplibregl.Marker({ element: markerEl, anchor: 'bottom' })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);
        });
      },

      error: (err) => {
        console.error('Clinics error:', err);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.mapSignal()?.remove();
  }
}
