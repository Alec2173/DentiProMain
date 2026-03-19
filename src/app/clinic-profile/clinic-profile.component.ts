import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClinicDataService, Clinic } from '../clinic-data.service';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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

  constructor(
    private route: ActivatedRoute,
    private clinicService: ClinicDataService,
    private authService: AuthService,
    private http: HttpClient,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
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

  ngOnDestroy() {
    this.map?.remove();
    if (this.suggestDebounce) clearTimeout(this.suggestDebounce);
  }
}
