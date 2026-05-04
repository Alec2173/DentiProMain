import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoCitiesService } from '../ro-cities.service';
import { ServiciiService } from '../servicii.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { ClinicDataService } from '../clinic-data.service';
import { SeoService } from '../seo.service';
import { Map as MaplibreMap, Marker, NavigationControl } from 'maplibre-gl';
import { PlanCardComponent } from '../pricing/plan-card/plan-card.component';
import { PLANS, PAID_PLANS_ENABLED } from '../pricing/plan.model';
import { AnalyticsService } from '../analytics.service';
import { ConfigService } from '../config.service';

const API = 'https://www.dentipro.ro/api';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, PlanCardComponent],
  templateUrl: './form.component.html',
  styleUrl: './form.component.css',
})
export class FormComponent implements OnInit, OnDestroy {

  // ── STEPS ──────────────────────────────────────────────────
  currentStep = 1;
  readonly totalSteps = 3;
  readonly stepLabels = ['Clinica', 'Plan', 'Finalizare'];
  readonly stepDescriptions = [
    'Informații esențiale',
    'Alege planul tău',
    'Verifică și trimite',
  ];

  // ── STATE ──────────────────────────────────────────────────
  isLoading = false;
  isUpdating = false;
  existingClinicId: number | null = null;
  errorMessage = '';
  submitSuccess = false;
  stripeRedirecting = false;
  checkoutCanceled = false;   // user a anulat pe Stripe și s-a întors
  billingAnnual = false;

  // ── CITY DROPDOWN ──────────────────────────────────────────
  searchCityInput = '';
  cityDropdownOpen = false;
  cities: string[] = [];

  // ── ADDRESS SEARCH ─────────────────────────────────────────
  addressSearch = '';
  addressResults: { place_name: string; center: [number, number] }[] = [];
  addressSearchOpen = false;
  addressSearchLoading = false;
  private searchTimeout: any;

  // ── SERVICES ──────────────────────────────────────────────
  serviceObject: { id: string; label: string }[] = [];
  customServices: { id: string; label: string }[] = [];
  newCustomService = '';

  // ── MEDIA ─────────────────────────────────────────────────
  logoName = '';
  imageNames: string[] = [];

  // ── MAP ───────────────────────────────────────────────────
  private mapInstance: MaplibreMap | null = null;
  private mapMarker: Marker | null = null;

  // ── FORM DATA ─────────────────────────────────────────────
  formData: any = {
    name: '',
    clientPhone: '',
    managerPhone: '',
    email: '',
    confirmEmail: '',
    city: '',
    logo: null,
    clinicImages: [],
    showPrices: null,
    additionalNotes: '',
    selectedServices: [] as string[],
    servicePrices: [] as { id: string; label: string; price: string }[],
    location: { lat: null as number | null, lng: null as number | null },
    onWebAccepted: false,
    termsAccepted: false,
    selectedPlan: 'starter',
    billingCycle: 'monthly',
  };

  // ── PLANS — sursă unică: plan.model.ts ─────────────────────
  readonly paidPlansEnabled = PAID_PLANS_ENABLED;
  readonly plans = PAID_PLANS_ENABLED ? PLANS : PLANS.filter(p => p.id === 'starter');

  private seo = inject(SeoService);
  private config = inject(ConfigService);

  private get headers(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  constructor(
    private roCitiesService: RoCitiesService,
    private serviciiService: ServiciiService,
    private http: HttpClient,
    private authService: AuthService,
    private clinicDataService: ClinicDataService,
    private router: Router,
    private route: ActivatedRoute,
    private analytics: AnalyticsService,
  ) {}

  ngOnInit() {
    // Redirect dacă nu e autentificat
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/clinici/autentificare'], {
        queryParams: { returnUrl: '/clinici/inscriere' },
      });
      return;
    }

    this.seo.set({
      title: 'Înscrie clinica ta pe DentiPro | Formular de înregistrare',
      description: 'Completează formularul de înregistrare și adaugă clinica ta dentară pe DentiPro. Vizibilitate imediată în căutările pacienților. Starter gratuit.',
      canonical: 'https://dentipro.ro/clinici/inscriere',
    });

    this.cities = this.roCitiesService.getCities();
    this.serviceObject = this.serviciiService.getServices();
    this.tryPrefillFromExistingClinic();
    if (!this.isUpdating) this.analytics.signupStarted();

    // Pre-selectează planul din query param (?plan=growth)
    const planParam = this.route.snapshot.queryParamMap.get('plan');
    if (planParam && ['starter', 'growth', 'pro'].includes(planParam)) {
      this.formData.selectedPlan = PAID_PLANS_ENABLED ? planParam : 'starter';
    }

    // Detectează întoarcerea din Stripe după anulare
    if (this.route.snapshot.queryParamMap.get('checkout') === 'canceled') {
      this.checkoutCanceled = true;
      this.currentStep = 2; // du direct la selecția planului
      this.analytics.paymentCanceled(this.formData.selectedPlan);
    }
  }

  private tryPrefillFromExistingClinic() {
    const clinicId = this.authService.currentUser?.clinicId;

    // Dacă nu are clinică, pre-fillăm numele din contul de utilizator
    if (!clinicId) {
      this.formData.name = this.authService.currentUser?.name ?? '';
      return;
    }

    this.existingClinicId = Number(clinicId);
    this.isUpdating = true;

    this.clinicDataService.getClinicById(this.existingClinicId).subscribe({
      next: (clinic) => {
        if (!clinic) return;
        this.formData.name = clinic.name ?? '';
        this.formData.clientPhone = clinic.phone_public ?? '';
        this.formData.managerPhone = clinic.phone_manager ?? '';
        this.formData.email = clinic.email ?? '';
        this.formData.confirmEmail = clinic.email ?? '';
        this.formData.city = clinic.city ?? '';
        this.searchCityInput = clinic.city ?? '';
        this.formData.showPrices = clinic.show_prices ?? null;
        this.formData.additionalNotes = clinic.additional_notes ?? '';
        this.formData.location.lat = clinic.latitude ?? null;
        this.formData.location.lng = clinic.longitude ?? null;
        this.formData.selectedPlan = clinic.plan ?? 'starter';

        // Pre-fill servicii
        if (clinic.services?.length > 0) {
          this.formData.selectedServices = clinic.services
            .filter(s => s.service_id)
            .map(s => s.service_id);
          this.formData.servicePrices = clinic.services.map(s => ({
            id: s.service_id ?? `custom_${s.label}`,
            label: s.label,
            price: s.price_min?.toString() ?? '',
            priceMax: s.price_max?.toString() ?? '',
            priceType: s.price_type ?? 'fixed',
          }));
        }
      },
    });
  }

  ngOnDestroy() {
    clearTimeout(this.searchTimeout);
    this.mapInstance?.remove();
  }

  // ── CITY ──────────────────────────────────────────────────
  get filteredCities(): string[] {
    const q = this.searchCityInput.toLowerCase();
    if (!q) return this.cities.slice(0, 12);
    return this.cities.filter((c) => c.toLowerCase().includes(q)).slice(0, 12);
  }

  onCityFocus(e: Event) {
    e.stopPropagation();
    this.cityDropdownOpen = true;
  }

  onCityInput() {
    this.cityDropdownOpen = true;
    if (this.formData.city && this.searchCityInput !== this.formData.city) {
      this.formData.city = '';
    }
  }

  selectCity(city: string) {
    this.formData.city = city;
    this.searchCityInput = city;
    this.cityDropdownOpen = false;
  }

  clearCity() {
    this.formData.city = '';
    this.searchCityInput = '';
    this.cityDropdownOpen = false;
  }

  closeCityDropdown() {
    this.cityDropdownOpen = false;
    this.addressSearchOpen = false;
  }

  // ── ADDRESS SEARCH (MapTiler Geocoding) ───────────────────
  onAddressInput() {
    clearTimeout(this.searchTimeout);
    this.addressSearchOpen = false;
    if (!this.addressSearch.trim()) {
      this.addressResults = [];
      return;
    }
    this.searchTimeout = setTimeout(() => this.searchAddress(), 380);
  }

  searchAddress() {
    const q = this.addressSearch.trim();
    if (!q) return;
    this.addressSearchLoading = true;
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${this.config.getMaptilerKey()}&country=ro&limit=6&language=ro`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.addressResults = (res.features ?? []).map((f: any) => ({
          place_name: f.place_name ?? f.text ?? '',
          center: f.center as [number, number],
        }));
        this.addressSearchOpen = this.addressResults.length > 0;
        this.addressSearchLoading = false;
      },
      error: () => {
        this.addressSearchLoading = false;
      },
    });
  }

  selectAddress(result: { place_name: string; center: [number, number] }) {
    const [lng, lat] = result.center;
    this.formData.location = { lat, lng };
    this.addressSearch = result.place_name;
    this.addressSearchOpen = false;

    this.mapInstance?.flyTo({ center: [lng, lat], zoom: 17, duration: 1000 });

    if (this.mapMarker) {
      this.mapMarker.setLngLat([lng, lat]);
    } else {
      this.mapMarker = new Marker({ color: '#2563eb' })
        .setLngLat([lng, lat])
        .addTo(this.mapInstance!);
    }
  }

  // ── MAP ───────────────────────────────────────────────────
  initLocationMap() {
    const el = document.getElementById('location-map');
    if (!el) return;

    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
      this.mapMarker = null;
    }

    this.mapInstance = new MaplibreMap({
      container: el,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${this.config.getMaptilerKey()}`,
      center: [25.0, 45.9],
      zoom: 6,
    });

    this.mapInstance.addControl(new NavigationControl(), 'top-right');

    this.mapInstance.on('load', () => {
      this.mapInstance?.resize();
      if (this.formData.location.lat) {
        this.mapMarker = new Marker({ color: '#2563eb' })
          .setLngLat([this.formData.location.lng!, this.formData.location.lat!])
          .addTo(this.mapInstance!);
        this.mapInstance?.flyTo({
          center: [this.formData.location.lng!, this.formData.location.lat!],
          zoom: 16,
        });
      }
    });

    this.mapInstance.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      this.formData.location = { lat, lng };
      if (this.mapMarker) {
        this.mapMarker.setLngLat([lng, lat]);
      } else {
        this.mapMarker = new Marker({ color: '#2563eb' })
          .setLngLat([lng, lat])
          .addTo(this.mapInstance!);
      }
    });
  }

  // ── SERVICES ──────────────────────────────────────────────
  get totalSelectedCount(): number {
    return this.formData.selectedServices.length;
  }

  isServiceSelected(id: string): boolean {
    return this.formData.selectedServices.includes(id);
  }

  onServiceChange(event: Event) {
    const el = event.target as HTMLInputElement;
    if (el.checked) {
      this.formData.selectedServices.push(el.value);
    } else {
      this.formData.selectedServices = this.formData.selectedServices.filter(
        (s: string) => s !== el.value,
      );
    }
  }

  addCustomService() {
    const label = this.newCustomService.trim();
    if (!label) return;
    if (
      this.customServices.find(
        (s) => s.label.toLowerCase() === label.toLowerCase(),
      )
    ) {
      this.errorMessage = 'Acest serviciu a fost deja adăugat.';
      return;
    }
    const id = 'custom_' + Date.now();
    this.customServices.push({ id, label });
    this.formData.selectedServices.push(id);
    this.newCustomService = '';
    this.errorMessage = '';
  }

  removeCustomService(id: string) {
    this.customServices = this.customServices.filter((s) => s.id !== id);
    this.formData.selectedServices = this.formData.selectedServices.filter(
      (s: string) => s !== id,
    );
  }

  // ── PRICES ────────────────────────────────────────────────
  buildPriceList() {
    const existing: { id: string; label: string; priceType: 'fixed' | 'range'; price: string; priceMax: string }[] =
      this.formData.servicePrices;

    this.formData.servicePrices = (this.formData.selectedServices as string[]).map(
      (id) => {
        const isCustom = id.startsWith('custom_');
        const label = isCustom
          ? (this.customServices.find((s) => s.id === id)?.label ?? id)
          : (this.serviceObject.find((s) => s.id === id)?.label ?? id);
        const prev = existing.find((p) => p.id === id);
        return {
          id,
          label,
          priceType: prev?.priceType ?? 'fixed',
          price: prev?.price ?? '',
          priceMax: prev?.priceMax ?? '',
        };
      },
    );
  }

  // ── UPLOAD ────────────────────────────────────────────────
  onLogoUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.formData.logo = input.files[0];
      this.logoName = this.formData.logo.name;
    }
  }

  onImagesUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.formData.clinicImages = Array.from(input.files);
      this.imageNames = this.formData.clinicImages.map((f: File) => f.name);
    }
  }

  // ── PLAN ─────────────────────────────────────────────────
  selectPlan(planId: string) {
    this.formData.selectedPlan = planId;
    this.formData.billingCycle = this.billingAnnual ? 'annual' : 'monthly';
  }

  toggleBilling() {
    this.billingAnnual = !this.billingAnnual;
    this.formData.billingCycle = this.billingAnnual ? 'annual' : 'monthly';
  }

  getDisplayPrice(plan: any): number {
    return this.billingAnnual ? plan.annualMonthlyPrice : plan.monthlyPrice;
  }

  getSelectedPlan() {
    return this.plans.find((p) => p.id === this.formData.selectedPlan);
  }

  // ── NAVIGATION ────────────────────────────────────────────
  nextStep() {
    if (!this.validateStep(this.currentStep)) return;

    // Step 2 + plan plătit → submit imediat + redirect Stripe
    if (this.currentStep === 2 && this.formData.selectedPlan !== 'starter') {
      this.analytics.signupStepCompleted(2, 'Plan');
      this.submitForCheckout();
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.analytics.signupStepCompleted(this.currentStep, this.stepLabels[this.currentStep - 1]);
      this.currentStep++;
      this.errorMessage = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Indicator pentru butonul din step 6 când e plan plătit */
  get isPaidPlanSelected(): boolean {
    return this.formData.selectedPlan !== 'starter';
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(step: number) {
    if (step >= this.currentStep) return;
    this.currentStep = step;
    this.errorMessage = '';
  }

  /** Apelat din PlanCardComponent (selectable mode) în step 6 */
  onPlanSelected(planId: string) {
    this.formData.selectedPlan = planId;
    this.formData.billingCycle = this.billingAnnual ? 'annual' : 'monthly';
  }

  // ── VALIDATION ────────────────────────────────────────────
  validateStep(step: number): boolean {
    this.errorMessage = '';
    const d = this.formData;

    if (step === 1) {
      if (!d.name.trim()) {
        this.errorMessage = 'Numele clinicii este obligatoriu.';
        return false;
      }
      if (!d.email) {
        this.errorMessage = 'Email-ul este obligatoriu.';
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
        this.errorMessage = 'Adresa de email nu este validă.';
        return false;
      }
      if (d.email !== d.confirmEmail) {
        this.errorMessage = 'Email-urile nu se potrivesc.';
        return false;
      }
      if (!d.city) {
        this.errorMessage = 'Selectați orașul din lista de sugestii.';
        return false;
      }
    }

    return true;
  }

  // ── SUBMIT ────────────────────────────────────────────────

  /** Construiește FormData din starea formularului */
  private buildFormData(): FormData {
    const d = this.formData;
    const fd = new FormData();
    fd.append('name', d.name);
    fd.append('clientPhone', d.clientPhone);
    fd.append('managerPhone', d.managerPhone);
    fd.append('email', d.email);
    fd.append('city', d.city);
    fd.append('showPrices', String(d.showPrices ?? false));
    fd.append('additionalNotes', d.additionalNotes);
    fd.append('latitude', d.location.lat?.toString() ?? '');
    fd.append('longitude', d.location.lng?.toString() ?? '');
    fd.append('selectedPlan', d.selectedPlan);
    fd.append('billingCycle', d.billingCycle);
    fd.append('customServices', JSON.stringify(this.customServices));
    fd.append('servicePrices', JSON.stringify(d.servicePrices));
    for (const s of d.selectedServices as string[]) fd.append('selectedServices', s);
    if (d.logo) fd.append('logo', d.logo);
    (d.clinicImages as File[]).forEach((img) => fd.append('clinicImages', img));
    return fd;
  }

  /**
   * Apelat din step 6 când planul e Growth/Pro.
   * Submit formular → backend creează clinica cu status pending_payment
   * și returnează checkoutUrl → redirect imediat la Stripe.
   */
  submitForCheckout() {
    this.isLoading = true;
    this.errorMessage = '';
    const d = this.formData;
    const fd = this.buildFormData();

    const request$ = this.isUpdating && this.existingClinicId
      ? this.http.put<any>(`${API}/clinics/${this.existingClinicId}`, fd, { headers: this.headers })
      : this.http.post<any>(`${API}/clinics`, fd, { headers: this.headers });

    request$.subscribe({
      next: (res) => {
        if (res?.clinic) this.authService.refreshCurrentUser();
        const checkoutUrl = res?.checkoutUrl;
        if (checkoutUrl) {
          this.analytics.paymentStarted(this.formData.selectedPlan, this.formData.billingCycle || 'monthly');
          this.stripeRedirecting = true;
          window.location.href = checkoutUrl;
        } else {
          // Plan plătit fără URL de checkout = eroare de configurare
          this.isLoading = false;
          this.errorMessage = 'Plata nu a putut fi inițiată. Contactați suportul la office.dentipro@gmail.com.';
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err?.error?.error || 'A apărut o eroare. Vă rugăm să încercați din nou.';
        this.isLoading = false;
      },
    });
  }

  /** Apelat din step 7 (Finalizare) — doar pentru planul Starter */
  onSubmit() {
    this.errorMessage = '';
    if (!this.formData.termsAccepted || !this.formData.onWebAccepted) {
      this.errorMessage =
        'Trebuie să acceptați termenii și să fiți de acord cu publicarea datelor.';
      return;
    }

    this.isLoading = true;
    const fd = this.buildFormData();

    const request$ = this.isUpdating && this.existingClinicId
      ? this.http.put<any>(`${API}/clinics/${this.existingClinicId}`, fd, { headers: this.headers })
      : this.http.post<any>(`${API}/clinics`, fd, { headers: this.headers });

    request$.subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res?.clinic) this.authService.refreshCurrentUser();
        this.submitSuccess = true;
        this.analytics.signupCompleted('starter');
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'A apărut o eroare la trimitere. Vă rugăm să încercați mai târziu.';
        this.isLoading = false;
      },
    });
  }
}


