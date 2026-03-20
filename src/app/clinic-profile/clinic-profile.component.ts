import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClinicDataService, Clinic, ClinicService } from '../clinic-data.service';
import { AuthService } from '../auth.service';
import { ServiciiService } from '../servicii.service';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe, DecimalPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Meta } from '@angular/platform-browser';
import * as maplibregl from 'maplibre-gl';

const MAPTILER_KEY = 'cwyGOMCDF8zwmBEDJrCr';

@Component({
  selector: 'app-clinic-profile',
  standalone: true,
  imports: [FormsModule, TitleCasePipe, DecimalPipe, RouterLink],
  templateUrl: './clinic-profile.component.html',
  styleUrl: './clinic-profile.component.css',
})
export class ClinicProfileComponent implements OnInit, OnDestroy {
  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('galleryInput') galleryInput!: ElementRef<HTMLInputElement>;
  @ViewChild('clinicMapContainer') clinicMapContainer!: ElementRef<HTMLDivElement>;

  clinic: Clinic | null = null;
  clinicImages: string[] = [];
  activeImageIndex = 0;
  isLoading = true;

  editingField: string | null = null;
  editValue = '';

  editingGallery = false;
  newImagePreviews: string[] = [];

  // ── SERVICES EDIT ─────────────────────────────────────
  editingServices = false;
  savingServices = false;
  servicesSaveError = '';
  allServices: { id: string; label: string }[] = [];
  servicesDraft: {
    id: string; label: string; selected: boolean;
    priceType: 'fixed' | 'range'; price: string; priceMax: string; isCustom: boolean;
  }[] = [];
  newCustomServiceInput = '';

  // ── PRICE INLINE EDIT ─────────────────────────────────
  editingPriceFor: string | null = null;
  editPriceValue = '';
  editPriceMaxValue = '';
  editPriceType: 'fixed' | 'range' = 'fixed';

  private map: maplibregl.Map | null = null;
  private marker: maplibregl.Marker | null = null;
  geocodingInProgress = false;
  mapAddressInput = '';
  mapSuggestions: { place_name: string; center: [number, number] }[] = [];
  showSuggestions = false;
  isEditingLocation = false;
  private suggestDebounce: ReturnType<typeof setTimeout> | null = null;
  // Temp values during editing — saved to backend only on confirm
  private editTempLat: number | null = null;
  private editTempLng: number | null = null;
  private editTempAddress = '';
  // Original values for cancel
  private origLat: number | null = null;
  private origLng: number | null = null;
  private origAddress = '';

  private metaService = inject(Meta);

  constructor(
    private route: ActivatedRoute,
    private clinicService: ClinicDataService,
    private authService: AuthService,
    private serviciiService: ServiciiService,
    private http: HttpClient,
    private zone: NgZone,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isClinic) {
      this.router.navigate(['/clinici/autentificare']);
      return;
    }
    this.allServices = this.serviciiService.getServices();
    // Pagina de management intern — nu trebuie indexată
    this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    const paramId = Number(this.route.snapshot.paramMap.get('id'));
    const id = isNaN(paramId) || paramId === 0
      ? Number(this.authService.currentUser?.clinicId)
      : paramId;

    if (!id || isNaN(id)) {
      this.isLoading = false;
      return;
    }

    this.clinicService.getClinicById(id).subscribe({
      next: (clinic: Clinic) => {
        this.clinic = clinic;
        this.clinicImages = Array.isArray(clinic.images) ? clinic.images : [];
        this.mapAddressInput = clinic.address || '';
        this.isLoading = false;
        setTimeout(() => this.initClinicMap(), 200);
      },
      error: () => { this.isLoading = false; },
    });
  }

  startEdit(field: string, value: string) {
    this.editingField = field;
    this.editValue = value ?? '';
  }

  saveEdit() {
    if (!this.clinic || !this.editingField) return;
    const field = this.editingField;
    const value = this.editValue;
    (this.clinic as any)[field] = value;
    this.editingField = null;
    this.editValue = '';
    const token = this.authService.getToken() ?? '';
    this.clinicService.updateClinic(this.clinic.id, { [field]: value } as Partial<Clinic>, token).subscribe({
      error: (err) => console.error('Eroare la salvare:', err),
    });
  }

  cancelEdit() {
    this.editingField = null;
    this.editValue = '';
  }

  get isIncomplete(): boolean {
    if (!this.clinic) return false;
    return (!this.clinic.services || this.clinic.services.length === 0) ||
           (this.clinicImages.length === 0) ||
           !this.clinic.address;
  }

  get isOwner(): boolean {
    return String(this.authService.currentUser?.clinicId) === String(this.clinic?.id);
  }

  get servicesArray(): string[] {
    if (!Array.isArray(this.clinic?.services)) return [];
    return this.clinic!.services.map((s) => s.label).filter(Boolean);
  }

  // --- Logo ---
  triggerLogoInput() {
    this.logoInput.nativeElement.click();
  }

  onLogoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0] || !this.clinic) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.clinic!.logo_url = e.target?.result as string;
    };
    reader.readAsDataURL(input.files[0]);
  }

  // --- Gallery ---
  openGalleryEdit() {
    this.editingGallery = true;
  }

  closeGalleryEdit() {
    this.editingGallery = false;
    this.newImagePreviews = [];
  }

  triggerGalleryInput() {
    this.galleryInput.nativeElement.click();
  }

  onGalleryFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.newImagePreviews.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeExistingImage(index: number) {
    this.clinicImages.splice(index, 1);
    if (this.activeImageIndex >= this.clinicImages.length) {
      this.activeImageIndex = Math.max(0, this.clinicImages.length - 1);
    }
  }

  removeNewPreview(index: number) {
    this.newImagePreviews.splice(index, 1);
  }

  saveGallery() {
    this.clinicImages = [...this.clinicImages, ...this.newImagePreviews];
    if (this.activeImageIndex >= this.clinicImages.length) {
      this.activeImageIndex = 0;
    }
    if (this.clinic) {
      const token = this.authService.getToken() ?? '';
      this.clinicService.updateClinic(this.clinic.id, {} as Partial<Clinic>, token).subscribe({
        error: (err) => console.error('Eroare la salvare galerie:', err),
      });
    }
    this.closeGalleryEdit();
  }

  // ── MAP ──────────────────────────────────────────────────

  get hasCoordinates(): boolean {
    return !!(Number(this.clinic?.latitude) && Number(this.clinic?.longitude));
  }

  private initClinicMap() {
    if (!this.clinicMapContainer?.nativeElement) return;

    const lat = Number(this.clinic?.latitude);
    const lng = Number(this.clinic?.longitude);
    const hasCoords = !!(lat && lng);

    this.zone.runOutsideAngular(() => {
      this.map = new maplibregl.Map({
        container: this.clinicMapContainer.nativeElement,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
        center: hasCoords ? [lng, lat] : [25.0, 45.9],
        zoom: hasCoords ? 15 : 6,
        interactive: true,
      });

      this.map.addControl(new maplibregl.NavigationControl(), 'top-right');

      this.map.on('load', () => {
        if (hasCoords) {
          this.marker = new maplibregl.Marker({ color: '#2563eb', draggable: false })
            .setLngLat([lng, lat])
            .addTo(this.map!);
        }

        // Map click — only in edit mode
        if (this.isOwner) {
          this.map!.on('click', (e: maplibregl.MapMouseEvent) => {
            if (!this.isEditingLocation) return;
            const { lat: clat, lng: clng } = e.lngLat;
            this.zone.run(() => this.placeMarkerTemp(clat, clng));
          });
        }
      });
    });
  }

  // ── Edit mode ──

  startLocationEdit() {
    this.origLat = Number(this.clinic?.latitude) || null;
    this.origLng = Number(this.clinic?.longitude) || null;
    this.origAddress = this.clinic?.address || '';
    this.editTempLat = this.origLat;
    this.editTempLng = this.origLng;
    this.editTempAddress = this.origAddress;
    this.mapAddressInput = this.origAddress;
    this.isEditingLocation = true;
    // Make marker draggable
    if (this.marker) this.marker.setDraggable(true);
    this.setupMarkerDrag();
  }

  cancelLocationEdit() {
    this.isEditingLocation = false;
    this.showSuggestions = false;
    this.mapSuggestions = [];
    this.mapAddressInput = this.origAddress;
    // Revert marker to original position
    if (this.origLat && this.origLng) {
      if (this.marker) {
        this.marker.setLngLat([this.origLng, this.origLat]);
        this.marker.setDraggable(false);
        this.map?.flyTo({ center: [this.origLng, this.origLat], zoom: 15 });
      }
    } else if (this.marker && !this.origLat) {
      // Pin was placed during edit but didn't exist before — remove it
      this.marker.remove();
      this.marker = null;
    }
  }

  saveLocation() {
    if (!this.clinic) return;
    this.isEditingLocation = false;
    this.showSuggestions = false;
    this.mapSuggestions = [];
    const addr = this.mapAddressInput.trim();
    this.clinic.address = addr;
    if (this.editTempLat !== null && this.editTempLng !== null) {
      this.clinic.latitude = this.editTempLat;
      this.clinic.longitude = this.editTempLng;
    }
    if (this.marker) this.marker.setDraggable(false);
    const token = this.authService.getToken() ?? '';
    this.clinicService.updateClinic(this.clinic.id, {
      address: addr,
      ...(this.editTempLat !== null ? { latitude: this.editTempLat, longitude: this.editTempLng! } : {}),
    } as any, token).subscribe();
  }

  // ── Temp placement (edit mode only) ──

  private placeMarkerTemp(lat: number, lng: number) {
    this.editTempLat = lat;
    this.editTempLng = lng;
    if (this.marker) {
      this.marker.setLngLat([lng, lat]);
    } else {
      this.zone.runOutsideAngular(() => {
        this.marker = new maplibregl.Marker({ color: '#2563eb', draggable: true })
          .setLngLat([lng, lat])
          .addTo(this.map!);
        this.setupMarkerDrag();
      });
    }
    this.reverseGeocodeTemp(lat, lng);
  }

  private setupMarkerDrag() {
    if (!this.marker) return;
    this.marker.on('dragend', () => {
      if (!this.isEditingLocation) return;
      const pos = this.marker!.getLngLat();
      this.zone.run(() => {
        this.editTempLat = pos.lat;
        this.editTempLng = pos.lng;
        this.reverseGeocodeTemp(pos.lat, pos.lng);
      });
    });
  }

  private reverseGeocodeTemp(lat: number, lng: number) {
    const url = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_KEY}&language=ro`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const feature = res.features?.[0];
        if (feature?.place_name) {
          const address = feature.place_name.replace(/, România$/, '').replace(/, Romania$/, '');
          this.mapAddressInput = address;
          this.editTempAddress = address;
        }
      },
    });
  }

  // ── Address search + autocomplete ──

  onAddressInput() {
    const query = this.mapAddressInput.trim();
    this.editTempAddress = query;
    if (!query || query.length < 3) {
      this.mapSuggestions = [];
      this.showSuggestions = false;
      return;
    }
    if (this.suggestDebounce) clearTimeout(this.suggestDebounce);
    this.suggestDebounce = setTimeout(() => {
      const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&language=ro&country=ro&limit=6`;
      this.http.get<any>(url).subscribe({
        next: (res) => {
          this.mapSuggestions = (res.features || []).map((f: any) => ({
            place_name: (f.place_name || '').replace(/, România$/, '').replace(/, Romania$/, ''),
            center: f.geometry.coordinates as [number, number],
          }));
          this.showSuggestions = this.mapSuggestions.length > 0;
        },
      });
    }, 300);
  }

  selectSuggestion(s: { place_name: string; center: [number, number] }) {
    const [flng, flat] = s.center;
    this.mapAddressInput = s.place_name;
    this.editTempAddress = s.place_name;
    this.editTempLat = flat;
    this.editTempLng = flng;
    this.showSuggestions = false;
    this.mapSuggestions = [];
    if (this.map) {
      this.map.flyTo({ center: [flng, flat], zoom: 15 });
      if (this.marker) {
        this.marker.setLngLat([flng, flat]);
      } else {
        this.zone.runOutsideAngular(() => {
          this.marker = new maplibregl.Marker({ color: '#2563eb', draggable: true })
            .setLngLat([flng, flat])
            .addTo(this.map!);
          this.setupMarkerDrag();
        });
      }
    }
    // No backend save here — waits for saveLocation()
  }

  geocodeClinicAddress() {
    const query = this.mapAddressInput.trim();
    if (!query || !this.map) return;
    this.geocodingInProgress = true;
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&language=ro&country=ro`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.geocodingInProgress = false;
        const feature = res.features?.[0];
        if (!feature?.geometry?.coordinates) return;
        const [flng, flat] = feature.geometry.coordinates;
        const address = (feature.place_name || query).replace(/, România$/, '').replace(/, Romania$/, '');
        this.mapAddressInput = address;
        this.editTempAddress = address;
        this.editTempLat = flat;
        this.editTempLng = flng;
        this.showSuggestions = false;
        this.zone.runOutsideAngular(() => {
          this.map!.flyTo({ center: [flng, flat], zoom: 15 });
          if (this.marker) {
            this.marker.setLngLat([flng, flat]);
          } else {
            this.marker = new maplibregl.Marker({ color: '#2563eb', draggable: true })
              .setLngLat([flng, flat])
              .addTo(this.map!);
            this.setupMarkerDrag();
          }
        });
        // No backend save here — waits for saveLocation()
      },
      error: () => { this.geocodingInProgress = false; },
    });
  }

  // ── SERVICES EDIT METHODS ─────────────────────────────

  openServicesEdit() {
    const existing = this.clinic?.services ?? [];
    const existingIds = new Set(existing.map(s => s.service_id ?? `custom_${s.label}`));

    this.servicesDraft = this.allServices.map(s => {
      const found = existing.find(e => e.service_id === s.id);
      return {
        id: s.id,
        label: s.label,
        selected: existingIds.has(s.id),
        priceType: (found?.price_type as 'fixed' | 'range') ?? 'fixed',
        price: found?.price_min?.toString() ?? '',
        priceMax: found?.price_max?.toString() ?? '',
        isCustom: false,
      };
    });

    // Adaugă serviciile custom existente
    existing
      .filter(s => !s.service_id)
      .forEach(s => {
        this.servicesDraft.push({
          id: `custom_${s.label}`,
          label: s.label,
          selected: true,
          priceType: (s.price_type as 'fixed' | 'range') ?? 'fixed',
          price: s.price_min?.toString() ?? '',
          priceMax: s.price_max?.toString() ?? '',
          isCustom: true,
        });
      });

    this.newCustomServiceInput = '';
    this.editingServices = true;
  }

  closeServicesEdit() {
    this.editingServices = false;
    this.servicesDraft = [];
    this.newCustomServiceInput = '';
    this.servicesSaveError = '';
  }

  get selectedServicesCount(): number {
    return this.servicesDraft.filter(s => s.selected).length;
  }

  toggleServiceInDraft(id: string) {
    const s = this.servicesDraft.find(x => x.id === id);
    if (s) s.selected = !s.selected;
  }

  addCustomToDraft() {
    const label = this.newCustomServiceInput.trim();
    if (!label) return;
    const id = `custom_${label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    this.servicesDraft.push({ id, label, selected: true, priceType: 'fixed', price: '', priceMax: '', isCustom: true });
    this.newCustomServiceInput = '';
  }

  removeCustomFromDraft(id: string) {
    this.servicesDraft = this.servicesDraft.filter(s => s.id !== id);
  }

  saveServices() {
    if (!this.clinic) return;
    this.savingServices = true;
    this.servicesSaveError = '';
    const selected = this.servicesDraft.filter(s => s.selected).map(s => ({
      id: s.id,
      label: s.label,
      priceType: s.priceType,
      price: s.price,
      priceMax: s.priceMax,
    }));
    if (selected.length < 1) {
      this.servicesSaveError = 'Selectați cel puțin un serviciu.';
      this.savingServices = false;
      return;
    }
    const token = this.authService.getToken() ?? '';
    this.clinicService.updateServices(this.clinic.id, selected, token).subscribe({
      next: (updated) => {
        this.clinic!.services = updated.services;
        this.savingServices = false;
        this.closeServicesEdit();
      },
      error: (err) => {
        this.servicesSaveError = err?.error?.error ?? 'Eroare la salvare. Încearcă din nou.';
        this.savingServices = false;
      },
    });
  }

  // ── PRICE INLINE EDIT METHODS ─────────────────────────

  startPriceEdit(service: ClinicService) {
    const key = service.service_id ?? `custom_${service.label}`;
    this.editingPriceFor = key;
    this.editPriceType = (service.price_type as 'fixed' | 'range') ?? 'fixed';
    this.editPriceValue = service.price_min?.toString() ?? '';
    this.editPriceMaxValue = service.price_max?.toString() ?? '';
  }

  cancelPriceEdit() {
    this.editingPriceFor = null;
    this.editPriceValue = '';
    this.editPriceMaxValue = '';
  }

  savePriceEdit() {
    if (!this.clinic || !this.editingPriceFor) return;
    const services = (this.clinic.services ?? []).map(s => {
      const key = s.service_id ?? `custom_${s.label}`;
      if (key === this.editingPriceFor) {
        return {
          id: s.service_id ?? `custom_${s.label}`,
          label: s.label,
          priceType: this.editPriceType,
          price: this.editPriceValue,
          priceMax: this.editPriceMaxValue,
        };
      }
      return {
        id: s.service_id ?? `custom_${s.label}`,
        label: s.label,
        priceType: s.price_type ?? 'fixed',
        price: s.price_min?.toString() ?? '',
        priceMax: s.price_max?.toString() ?? '',
      };
    });
    const token = this.authService.getToken() ?? '';
    this.clinicService.updateServices(this.clinic.id, services, token).subscribe({
      next: (updated) => {
        this.clinic!.services = updated.services;
        this.cancelPriceEdit();
      },
      error: (err) => console.error('Eroare la salvare preț:', err),
    });
  }

  ngOnDestroy() {
    this.map?.remove();
    if (this.suggestDebounce) clearTimeout(this.suggestDebounce);
  }
}
