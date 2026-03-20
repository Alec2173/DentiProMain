import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, inject } from '@angular/core';
import { ClinicDataService } from '../clinic-data.service';
import { FavoritesService } from '../favorites.service';
import { AuthService } from '../auth.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import * as maplibregl from 'maplibre-gl';
import { SeoService } from '../seo.service';

const MAPTILER_KEY = 'cwyGOMCDF8zwmBEDJrCr';

@Component({
  selector: 'app-descripton-page',
  imports: [CommonModule],
  templateUrl: './descripton-page.component.html',
  styleUrl: './descripton-page.component.css',
})
export class DescriptonPageComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private seo = inject(SeoService);

  constructor(
    private clinicData: ClinicDataService,
    private route: ActivatedRoute,
    public favorites: FavoritesService,
    public auth: AuthService,
    private http: HttpClient,
    private zone: NgZone,
  ) {}

  clinics: any = {};
  isLoading = true;
  clinicImages: string[] = [];
  activeImageIndex = 0;
  geocodedAddress: string | null = null;

  private map: maplibregl.Map | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.clinicData.getClinicById(Number(id)).subscribe({
      next: (clinic) => {
        this.clinics = clinic;
        this.clinicImages = Array.isArray(clinic.images) ? clinic.images : [];
        this.isLoading = false;

        // SEO dinamic cu datele clinicii
        const title = `${clinic.name} — ${clinic.city || 'România'} | DentiPro`;
        const desc = `${clinic.name} din ${clinic.city || 'România'}. ${clinic.additional_notes ? clinic.additional_notes.slice(0, 120) + '...' : 'Servicii stomatologice de calitate. Rezervă o programare online pe DentiPro.'}`;
        this.seo.set({
          title,
          description: desc,
          canonical: `https://dentipro.ro/descripton/${id}`,
          image: this.clinicImages[0] || undefined,
          schema: {
            '@context': 'https://schema.org',
            '@type': ['LocalBusiness', 'MedicalOrganization'],
            name: clinic.name,
            medicalSpecialty: 'Dentistry',
            description: desc,
            image: this.clinicImages[0] || 'https://dentipro.ro/logo-new.png',
            url: `https://dentipro.ro/descripton/${id}`,
            telephone: clinic.phone_public || undefined,
            address: {
              '@type': 'PostalAddress',
              addressLocality: clinic.city || undefined,
              addressCountry: 'RO',
              streetAddress: clinic.address || undefined,
            },
          },
        });

        const lat = Number(clinic.latitude);
        const lng = Number(clinic.longitude);
        if (lat && lng) {
          if (!clinic.address) {
            this.reverseGeocode(lat, lng);
          }
          setTimeout(() => this.initMap(lat, lng), 150);
        }
      },
      error: () => (this.isLoading = false),
    });
    this.favorites.loadAll();
  }

  private initMap(lat: number, lng: number) {
    if (!this.mapContainer?.nativeElement) return;

    this.zone.runOutsideAngular(() => {
      this.map = new maplibregl.Map({
        container: this.mapContainer.nativeElement,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
        center: [lng, lat],
        zoom: 15,
        interactive: true,
      });

      this.map.addControl(new maplibregl.NavigationControl(), 'top-right');

      this.map.on('load', () => {
        new maplibregl.Marker({ color: '#2563eb' })
          .setLngLat([lng, lat])
          .addTo(this.map!);
      });
    });
  }

  private reverseGeocode(lat: number, lng: number) {
    const url = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_KEY}&language=ro`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const feature = res.features?.[0];
        if (feature?.place_name) {
          this.zone.run(() => {
            this.geocodedAddress = feature.place_name
              .replace(/, România$/, '')
              .replace(/, Romania$/, '');
          });
        }
      },
    });
  }

  get displayAddress(): string | null {
    return this.clinics?.address || this.geocodedAddress || null;
  }

  get hasMap(): boolean {
    return !!(Number(this.clinics?.latitude) && Number(this.clinics?.longitude));
  }

  toggleFavorite() {
    if (!this.auth.isLoggedIn || !this.clinics?.id) return;
    this.favorites.toggle(this.clinics.id);
  }

  get isFavorited(): boolean {
    return this.clinics?.id ? this.favorites.isFavorited(this.clinics.id) : false;
  }

  ngOnDestroy() {
    this.map?.remove();
  }
}
