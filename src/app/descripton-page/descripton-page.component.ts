import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, inject } from '@angular/core';
import { ClinicDataService } from '../clinic-data.service';
import { FavoritesService } from '../favorites.service';
import { AuthService } from '../auth.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as maplibregl from 'maplibre-gl';
import { SeoService } from '../seo.service';

const API = 'https://www.dentipro.ro/api';

const MAPTILER_KEY = 'cwyGOMCDF8zwmBEDJrCr';

@Component({
  selector: 'app-descripton-page',
  imports: [CommonModule, FormsModule],
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

  readonly clinicId = () => Number(this.route.snapshot.paramMap.get('id'));

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
    this.loadReviews();
    this.checkCanReview();
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
    const wasFav = this.isFavorited;
    this.favorites.toggle(this.clinics.id);
    if (!wasFav) {
      // Show service interest popup after saving
      this.showServicePopup = true;
    }
  }

  get isFavorited(): boolean {
    return this.clinics?.id ? this.favorites.isFavorited(this.clinics.id) : false;
  }

  // ── MESSAGE MODAL ─────────────────────────────────────────────
  showMsgModal = false;
  msgName = '';
  msgEmail = '';
  msgPhone = '';
  msgBody = '';
  msgSending = false;
  msgSent = false;
  msgError = '';

  openMsgModal() {
    this.showMsgModal = true;
    this.msgSent = false;
    this.msgError = '';
    // Pre-fill from auth if logged in
    if (this.auth.isLoggedIn && this.auth.currentUser) {
      this.msgName = this.auth.currentUser.name || '';
      this.msgEmail = this.auth.currentUser.email || '';
    }
  }

  closeMsgModal() {
    this.showMsgModal = false;
  }

  sendMsg() {
    if (!this.msgName.trim()) { this.msgError = 'Introduceți numele.'; return; }
    if (!this.msgEmail.trim() || !this.msgEmail.includes('@')) { this.msgError = 'Introduceți un email valid.'; return; }
    if (!this.msgBody.trim()) { this.msgError = 'Mesajul nu poate fi gol.'; return; }
    if (this.msgBody.length > 2000) { this.msgError = 'Mesajul este prea lung (max 2000 caractere).'; return; }

    this.msgSending = true;
    this.msgError = '';

    this.http.post(`${API}/messages`, {
      clinicId: this.clinics.id,
      senderName: this.msgName.trim(),
      senderEmail: this.msgEmail.trim(),
      senderPhone: this.msgPhone.trim() || null,
      body: this.msgBody.trim(),
    }).subscribe({
      next: () => { this.msgSending = false; this.msgSent = true; },
      error: (err) => {
        this.msgError = err.error?.error || 'A apărut o eroare. Încearcă din nou.';
        this.msgSending = false;
      },
    });
  }

  // ── SERVICE INTEREST POPUP ────────────────────────────────────
  showServicePopup = false;
  selectedService = '';

  readonly serviceInterestOptions = [
    'Implanturi', 'Aparat dentar', 'Albire', 'Detartraj', 'Obturație',
    'Tratament de canal', 'Fațete', 'Extracție', 'Consultație', 'Altele',
  ];

  saveServiceInterest() {
    if (this.selectedService && this.clinics?.id) {
      const key = `dp_fav_service_${this.clinics.id}`;
      localStorage.setItem(key, this.selectedService);
    }
    this.showServicePopup = false;
  }

  closeServicePopup() {
    this.showServicePopup = false;
  }

  // ── BOOKING MODAL ────────────────────────────────────────────
  showBooking = false;
  bookingStep: 'form' | 'success' = 'form';
  bookingServiceId: string = '';
  bookingDate = '';
  bookingTime = '';
  bookingNotes = '';
  bookingLoading = false;
  bookingError = '';
  todayDate = new Date().toISOString().split('T')[0];

  get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  openBooking() {
    this.showBooking = true;
    this.bookingStep = 'form';
    this.bookingServiceId = '';
    this.bookingDate = '';
    this.bookingTime = '';
    this.bookingNotes = '';
    this.bookingError = '';
    this.bookingLoading = false;
  }

  closeBooking() {
    this.showBooking = false;
  }

  submitBooking() {
    if (!this.bookingDate) { this.bookingError = 'Selectează o dată.'; return; }
    this.bookingLoading = true;
    this.bookingError = '';
    this.http.post(`${API}/appointments`, {
      clinicId: this.clinics.id,
      date: this.bookingDate,
      time: this.bookingTime || null,
      notes: this.bookingNotes || '',
      serviceId: this.bookingServiceId ? Number(this.bookingServiceId) : null,
    }, { headers: this.headers }).subscribe({
      next: () => { this.bookingStep = 'success'; this.bookingLoading = false; },
      error: (err) => {
        this.bookingError = err.error?.error || 'A apărut o eroare. Încearcă din nou.';
        this.bookingLoading = false;
      }
    });
  }

  // ── REVIEWS ───────────────────────────────────────────────────
  reviews: any[] = [];
  reviewsLoading = false;
  avgRating: number | null = null;
  reviewCount = 0;
  canReview = false;

  showReviewModal = false;
  reviewRating = 0;
  reviewHover = 0;
  reviewText = '';
  reviewSending = false;
  reviewSent = false;
  reviewError = '';

  loadReviews() {
    const id = this.clinicId();
    this.reviewsLoading = true;
    this.http.get<any>(`${API}/reviews/clinic/${id}`).subscribe({
      next: (res) => {
        this.reviews = res.reviews ?? [];
        this.avgRating = res.avgRating ?? null;
        this.reviewCount = res.count ?? this.reviews.length;
        this.reviewsLoading = false;
      },
      error: () => { this.reviewsLoading = false; },
    });
  }

  checkCanReview() {
    if (!this.auth.isPatient) return;
    const id = this.clinicId();
    this.http.get<any>(`${API}/reviews/clinic/${id}/can-review`, { headers: this.headers }).subscribe({
      next: (res) => { this.canReview = !!res.canReview; },
      error: () => {},
    });
  }

  openReviewModal() {
    this.showReviewModal = true;
    this.reviewRating = 0;
    this.reviewHover = 0;
    this.reviewText = '';
    this.reviewError = '';
    this.reviewSent = false;
  }

  closeReviewModal() { this.showReviewModal = false; }

  setReviewRating(n: number) { this.reviewRating = n; }
  hoverStar(n: number) { this.reviewHover = n; }
  clearHover() { this.reviewHover = 0; }

  submitReview() {
    if (!this.reviewRating) { this.reviewError = 'Alege un număr de stele.'; return; }
    if (this.reviewText.trim().length < 10) { this.reviewError = 'Scrie minim 10 caractere.'; return; }

    this.reviewSending = true;
    this.reviewError = '';
    this.http.post(`${API}/reviews`, {
      clinicId: this.clinicId(),
      rating: this.reviewRating,
      text: this.reviewText.trim(),
    }, { headers: this.headers }).subscribe({
      next: () => {
        this.reviewSending = false;
        this.reviewSent = true;
        this.canReview = false;
        this.loadReviews();
      },
      error: (err) => {
        this.reviewError = err.error?.error || 'A apărut o eroare. Încearcă din nou.';
        this.reviewSending = false;
      },
    });
  }

  starsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  formatReviewDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  }

  ngOnDestroy() {
    this.map?.remove();
  }
}
