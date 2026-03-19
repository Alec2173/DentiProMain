import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoCitiesService } from '../ro-cities.service';
import { ServiciiService } from '../servicii.service';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Map as MaplibreMap, Marker, NavigationControl } from 'maplibre-gl';

const MAPTILER_KEY = 'cwyGOMCDF8zwmBEDJrCr';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './form.component.html',
  styleUrl: './form.component.css',
})
export class FormComponent implements OnInit, OnDestroy {

  // ── STEPS ──────────────────────────────────────────────────
  currentStep = 1;
  readonly totalSteps = 6;
  readonly stepLabels = ['Clinica', 'Profil', 'Locație', 'Servicii', 'Prețuri', 'Finalizare'];
  readonly stepDescriptions = [
    'Informații de bază',
    'Media & display',
    'Adresă & hartă',
    'Servicii oferite',
    'Prețuri servicii',
    'Pachet & confirmare',
  ];

  // ── STATE ──────────────────────────────────────────────────
  isLoading = false;
  errorMessage = '';
  submitSuccess = false;
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

  // ── PLANS ─────────────────────────────────────────────────
  readonly plans = [
    {
      id: 'starter',
      name: 'Starter',
      tagline: 'Vizibilitate de bază, gratuit permanent',
      monthlyPrice: 0,
      annualMonthlyPrice: 0,
      annualTotal: 0,
      badge: null,
      featured: false,
      cta: 'Începe gratuit',
      features: [
        { text: 'Profil public pe platformă', included: true, tag: null },
        { text: 'Marker pe harta interactivă', included: true, tag: null },
        { text: 'Până la 5 imagini în galerie', included: true, tag: null },
        { text: 'Apariție în rezultatele search', included: true, tag: null },
        { text: 'Feed pacienți & oferte', included: false, tag: null },
        { text: 'Apariție pe homepage', included: false, tag: null },
        { text: 'Analytics & rapoarte', included: false, tag: null },
        { text: 'Notificări pacienți 20km', included: false, tag: null },
      ],
    },
    {
      id: 'growth',
      name: 'Growth',
      tagline: 'Pentru clinici care vor să crească',
      monthlyPrice: 49,
      annualMonthlyPrice: 41,
      annualTotal: 490,
      badge: 'Cel mai ales',
      featured: true,
      cta: 'Activează Growth',
      features: [
        { text: 'Galerie nelimitată (foto + video)', included: true, tag: null },
        { text: 'Prioritate în search față de Starter', included: true, tag: null },
        { text: 'Apariție pe homepage', included: true, tag: 'NOU' },
        { text: 'Feed pacienți — 10 oferte/lună', included: true, tag: null },
        { text: 'Analytics de bază', included: true, tag: null },
        { text: 'Notificări pacienți 20km', included: false, tag: null },
        { text: 'Banderolă Promovat', included: false, tag: null },
        { text: 'Suport prioritar 24h', included: false, tag: null },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'Vizibilitate maximă, fără compromisuri',
      monthlyPrice: 99,
      annualMonthlyPrice: 83,
      annualTotal: 990,
      badge: null,
      featured: false,
      cta: 'Activează Pro',
      features: [
        { text: 'Top 3 poziții în search per oraș', included: true, tag: null },
        { text: 'Banderolă Promovat vizibilă', included: true, tag: null },
        { text: 'Oferte nelimitate în feed pacienți', included: true, tag: null },
        { text: 'Notificări pacienți în raza 20km', included: true, tag: 'SMART' },
        { text: 'Modul stocuri & alerte expirare', included: true, tag: 'NOU' },
        { text: 'Analytics avansat & benchmark', included: true, tag: null },
        { text: 'Suport prioritar 24h', included: true, tag: null },
        { text: 'Toate beneficiile Growth incluse', included: true, tag: null },
      ],
    },
  ];

  constructor(
    private roCitiesService: RoCitiesService,
    private serviciiService: ServiciiService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.cities = this.roCitiesService.getCities();
    this.serviceObject = this.serviciiService.getServices();
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
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${MAPTILER_KEY}&country=ro&limit=6&language=ro`;
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
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
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
    if (this.currentStep < this.totalSteps) {
      const entering = this.currentStep + 1;
      this.currentStep++;
      this.errorMessage = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (entering === 3) {
        setTimeout(() => this.initLocationMap(), 80);
      } else if (entering === 5) {
        this.buildPriceList();
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      const entering = this.currentStep - 1;
      this.currentStep--;
      this.errorMessage = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (entering === 3) {
        setTimeout(() => this.initLocationMap(), 80);
      }
    }
  }

  goToStep(step: number) {
    if (step >= this.currentStep) return;
    this.currentStep = step;
    this.errorMessage = '';
    if (step === 3) {
      setTimeout(() => this.initLocationMap(), 80);
    }
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
      if (!/^\d{10}$/.test(d.clientPhone)) {
        this.errorMessage = 'Telefonul afișat pe platformă trebuie să conțină exact 10 cifre.';
        return false;
      }
      if (!/^\d{10}$/.test(d.managerPhone)) {
        this.errorMessage = 'Telefonul managerului trebuie să conțină exact 10 cifre.';
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

    if (step === 3) {
      if (!d.location.lat || !d.location.lng) {
        this.errorMessage = 'Adăugați locația clinicii — căutați adresa sau dați click pe hartă.';
        return false;
      }
    }

    if (step === 4) {
      const total = d.selectedServices.length;
      if (total < 5) {
        this.errorMessage = `Selectați cel puțin 5 servicii. Ați selectat ${total} — mai aveți nevoie de ${5 - total}.`;
        return false;
      }
    }

    if (step === 5) {
      const empty = (d.servicePrices as any[]).filter((p) => {
        if (p.priceType === 'range') {
          return p.price === '' || p.price === null || p.priceMax === '' || p.priceMax === null;
        }
        return p.price === '' || p.price === null || p.price === undefined;
      });
      if (empty.length > 0) {
        this.errorMessage = `Completați prețul pentru toate serviciile. ${empty.length} rămase fără preț.`;
        return false;
      }
    }

    return true;
  }

  // ── SUBMIT ────────────────────────────────────────────────
  onSubmit() {
    this.errorMessage = '';
    if (!this.formData.termsAccepted || !this.formData.onWebAccepted) {
      this.errorMessage =
        'Trebuie să acceptați termenii și să fiți de acord cu publicarea datelor.';
      return;
    }

    this.isLoading = true;
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

    this.http.post('https://www.dentipro.ro/api/clinics', fd).subscribe({
      next: () => {
        this.isLoading = false;
        this.submitSuccess = true;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage =
          'A apărut o eroare la trimitere. Vă rugăm să încercați mai târziu.';
        this.isLoading = false;
      },
    });
  }
}
