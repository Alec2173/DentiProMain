import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SeoService } from '../seo.service';
import { PlanCardComponent } from '../pricing/plan-card/plan-card.component';
import { PLANS } from '../pricing/plan.model';

const API = '/api';

@Component({
  selector: 'app-parteneriat',
  standalone: true,
  imports: [FormsModule, RouterLink, PlanCardComponent],
  templateUrl: './parteneriat.component.html',
  styleUrl: './parteneriat.component.css',
})
export class ParteneriatComponent implements OnInit {
  private http   = inject(HttpClient);
  private seo    = inject(SeoService);
  private route  = inject(ActivatedRoute);

  // ── Pre-fill & dropdown ────────────────────────────────
  allClinics: { id: number; name: string; city: string; phone: string; email: string }[] = [];
  selectedClinicId: number | null = null;
  isPreFilled = false;

  readonly proPlan = PLANS.find(p => p.id === 'pro')!;

  // Form state
  step = 1;
  readonly totalSteps = 3;
  submitting = false;
  submitted  = false;
  declined   = false; // "Nu sunt interesat"
  error      = '';

  // Beneficii pentru pacienți
  beneficii = {
    consultatie_gratuita    : false,
    reducere_procentuala    : false,
    reducere_fixa           : false,
    detartraj_promo         : false,
    albire_promo            : false,
    radiografie_gratuita    : false,
    plan_tratament_gratuit  : false,
    voucher_valoric         : false,
    pachet_pacienti_noi     : false,
    alt_beneficiu           : false,
  };
  altBeneficiu = '';

  // Reducere
  reducere = {
    p5: false, p10: false, p15: false, p20: false, alta: false,
  };
  altaReducere = '';

  // Servicii
  servicii = {
    consultatii: false, implantologie: false, ortodontie: false,
    estetica: false, albire: false, fatete: false,
    endodontie: false, chirurgie: false, pedodontie: false,
    toate: false,
  };

  // Model business
  model = {
    abonament_lunar: false, comision_pacient: false,
    comision_finalizat: false, mixt: false, neinteresat: false,
  };

  // Date clinică
  clinica = {
    nume: '', oras: '', contact: '', telefon: '', email: '', comentarii: '',
  };

  // Animație counter
  readonly stats = [
    { val: '70+',  label: 'clinici înscrise' },
    { val: 'Top 3', label: 'vizibilitate în căutări' },
    { val: '0 RON', label: 'cost pentru Starter' },
  ];

  readonly benefits = [
    { icon: 'fa-crown',          text: 'DentiPro Pro GRATUIT pe durata parteneriatului' },
    { icon: 'fa-certificate',    text: 'Badge „Partener Oficial DentiPro"' },
    { icon: 'fa-sort-amount-up', text: 'Promovare prioritară — Top 3 în căutări' },
    { icon: 'fa-map-marker-alt', text: 'Pin VIP auriu pe harta interactivă' },
    { icon: 'fa-bullhorn',       text: 'Expunere în campaniile de marketing DentiPro' },
    { icon: 'fa-users',          text: 'Acces la programul de recompense pentru pacienți' },
    { icon: 'fa-chart-line',     text: 'Dashboard analytics și statistici avansate' },
  ];

  scrollToForm() {
    document.getElementById('formular')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngOnInit() {
    this.seo.set({
      title: 'Program Partener DentiPro — Clinici Partenere',
      description: 'Devino partener DentiPro și primești acces gratuit la Pro, badge oficial și promovare prioritară. Completează formularul în 3 minute.',
      canonical: 'https://dentipro.ro/clinici/parteneriat',
    });

    // Load clinics dropdown
    this.http.get<any[]>(`${API}/partner/clinics-list`).subscribe({
      next: (list) => { this.allClinics = list; },
      error: () => {},
    });

    // Pre-fill from ?clinic=ID in URL
    this.route.queryParams.subscribe(params => {
      const id = parseInt(params['clinic'], 10);
      if (!isNaN(id) && id > 0) {
        this.http.get<any>(`${API}/partner/clinic/${id}`).subscribe({
          next: (c) => {
            this.selectedClinicId = c.id;
            this.clinica.nume    = c.name ?? '';
            this.clinica.oras    = c.city ?? '';
            this.clinica.telefon = c.phone ?? '';
            this.clinica.email   = c.email ?? '';
            this.isPreFilled     = true;
          },
          error: () => {},
        });
      }
    });
  }

  onClinicSelect() {
    if (!this.selectedClinicId) return;
    const found = this.allClinics.find(c => c.id === this.selectedClinicId);
    if (found) {
      this.clinica.nume    = found.name;
      this.clinica.oras    = found.city;
      this.clinica.telefon = found.phone;
      this.clinica.email   = found.email;
      this.isPreFilled     = true;
    }
  }

  resetClinic() {
    this.isPreFilled     = false;
    this.selectedClinicId = null;
    this.clinica.nume    = '';
    this.clinica.oras    = '';
    this.clinica.telefon = '';
    this.clinica.email   = '';
  }

  private scrollToFormTop() {
    const el = document.getElementById('formular');
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  nextStep() {
    if (this.step < this.totalSteps) this.step++;
    setTimeout(() => this.scrollToFormTop(), 50);
  }

  prevStep() {
    if (this.step > 1) this.step--;
    setTimeout(() => this.scrollToFormTop(), 50);
  }

  canProceed(): boolean {
    return true; // Toate câmpurile sunt opționale — validare finală la submit
  }

  decline() {
    this.declined = true;
    setTimeout(() => this.scrollToFormTop(), 50);
  }

  submit() {
    if (!this.clinica.nume.trim() || !this.clinica.email.trim()) {
      this.error = 'Completează cel puțin numele clinicii și emailul.';
      return;
    }
    this.error = '';
    this.submitting = true;

    const payload = {
      beneficii        : { ...this.beneficii, alt: this.altBeneficiu },
      reducere         : { ...this.reducere, alta: this.altaReducere },
      servicii         : this.servicii,
      model_business   : this.model,
      clinica          : this.clinica,
    };

    this.http.post(`${API}/partner-application`, payload).subscribe({
      next: () => { this.submitting = false; this.submitted = true; setTimeout(() => this.scrollToFormTop(), 50); },
      error: (e) => {
        this.error = e.error?.error || 'Eroare la trimitere. Încearcă din nou.';
        this.submitting = false;
      },
    });
  }

  beneficiiSelected(): number {
    return Object.values(this.beneficii).filter(Boolean).length;
  }

  toggleServiciiAll() {
    const allVal = !this.servicii.toate;
    Object.keys(this.servicii).forEach(k => (this.servicii as Record<string,boolean>)[k] = allVal);
  }

  getServiciu(key: string): boolean {
    return (this.servicii as Record<string,boolean>)[key] ?? false;
  }

  setServiciu(key: string, val: boolean) {
    (this.servicii as Record<string,boolean>)[key] = val;
    if (key !== 'toate') this.servicii.toate = false;
  }

  getModel(key: string): boolean {
    return (this.model as Record<string,boolean>)[key] ?? false;
  }

  setModel(key: string, val: boolean) {
    (this.model as Record<string,boolean>)[key] = val;
  }
}
