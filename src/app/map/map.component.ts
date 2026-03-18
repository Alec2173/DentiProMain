import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  viewChild,
  signal,
} from '@angular/core';

import { Map, NavigationControl, ScaleControl } from 'maplibre-gl';
import * as maplibregl from 'maplibre-gl';

import { ClinicDataService } from '../clinic-data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
})
export class MapComponent implements OnInit, OnDestroy {
  mapElement = viewChild.required<ElementRef<HTMLDivElement>>('mapppp');

  mapSignal = signal<Map | null>(null);

  constructor(
    private clinicService: ClinicDataService,
    private router: Router,
  ) {}

  ngOnInit() {
    const map = new Map({
      container: this.mapElement().nativeElement,
      style:
        'https://api.maptiler.com/maps/streets-v2/style.json?key=cwyGOMCDF8zwmBEDJrCr',
      center: [26.1025, 44.4268],
      zoom: 11,
    });

    this.mapSignal.set(map);

    map.addControl(new NavigationControl(), 'top-right');
    map.addControl(new ScaleControl(), 'bottom-left');

    map.on('load', () => {
      map.resize();
      this.loadClinics();
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

          card.innerHTML = `
            <div class="popup-image">
              <img src="${clinic.clinic_images_parsed?.[0] || 'fundal.png'}"/>
            </div>

            <div class="popup-info">

              <div class="popup-header">

                <img class="popup-logo"
                     src="${clinic.logo_path || 'no-img.jpg'}"/>

                <span class="popup-city">
                  ${clinic.city}
                </span>

              </div>

              <div class="popup-name">
                ${clinic.name}
              </div>

              <div class="popup-rating">
                ⭐ 4.5
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

          new maplibregl.Marker({ color: '#2563eb' })
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
    this.mapSignal()?.remove();
  }
}
