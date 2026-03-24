import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

const API = 'https://www.dentipro.ro/api';

interface AdminClinic {
  id: number;
  name: string;
  email: string;
  city: string;
  status: 'active' | 'pending' | 'suspended';
  plan: string;
  created_at: string;
  logo_url: string | null;
  phone_public: string;
  has_address: boolean;
  has_description: boolean;
  user_id: number | null;
  user_email: string | null;
  user_name: string | null;
  email_verified: boolean;
  last_login_at: string | null;
  image_count: number;
  service_count: number;
}

interface AddClinicForm {
  name: string;
  email: string;
  city: string;
  phone: string;
  plan: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  clinics: AdminClinic[] = [];
  filtered: AdminClinic[] = [];
  isLoading = true;
  filterStatus: 'all' | 'active' | 'pending' | 'suspended' = 'all';
  filterOnboarding: 'all' | 'never_logged' | 'not_verified' | 'incomplete' = 'all';
  searchQuery = '';
  confirmDeleteId: number | null = null;
  adminPage = 0;
  readonly adminPageSize = 25;
  creatingAccounts = false;
  onboarding = false;
  onboardResult: any[] | null = null;
  accountsResult: any[] | null = null;

  // Add clinic
  showAddClinic = false;
  addingClinic = false;
  addClinicError = '';
  addClinicForm: AddClinicForm = { name: '', email: '', city: '', phone: '', plan: 'starter' };

  // Resend welcome emails
  resendingEmails = false;
  resendResult: any[] | null = null;

  // Batch test clinics
  addingBatch = false;
  batchResult: any[] | null = null;

  // Simulate clinics
  simulating = false;
  simulateResult: any[] | null = null;

  readonly TEST_CLINICS: AddClinicForm[] = [
    { name: 'Clinica Test Alec 1', email: 'alec.constant300604@gmail.com',    city: 'București',  phone: '0700000001', plan: 'starter' },
    { name: 'Clinica Test Alec 2', email: 'alecconstantinescu987@gmail.com',   city: 'București',  phone: '0700000002', plan: 'starter' },
    { name: 'Clinica Test Emma',   email: 'emmadrugea235@gmail.com',           city: 'Cluj-Napoca',phone: '0700000003', plan: 'starter' },
    { name: 'Clinica Test Alec 4', email: 'alec.constantinescu04@gmail.com',   city: 'Timișoara',  phone: '0700000004', plan: 'starter' },
  ];

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    console.log('[Admin] isAdmin:', this.auth.isAdmin, '| role:', this.auth.currentUser?.role);
    if (!this.auth.isAdmin) {
      this.router.navigate(['/']);
      return;
    }
    this.load();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  load() {
    this.isLoading = true;
    this.http.get<AdminClinic[]>(`${API}/admin/clinics`, { headers: this.headers() }).subscribe({
      next: (data) => {
        this.clinics = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[Admin] Eroare la încărcarea clinicilor:', err.status, err.message, err);
        this.isLoading = false;
      },
    });
  }

  applyFilter() {
    let list = this.clinics;
    if (this.filterStatus !== 'all') list = list.filter(c => c.status === this.filterStatus);
    if (this.filterOnboarding === 'never_logged') list = list.filter(c => !c.last_login_at);
    if (this.filterOnboarding === 'not_verified')  list = list.filter(c => c.user_id && !c.email_verified);
    if (this.filterOnboarding === 'incomplete')    list = list.filter(c => !this.isProfileComplete(c));
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      );
    }
    this.filtered = list;
    this.adminPage = 0;
  }

  get pagedClinics() {
    const start = this.adminPage * this.adminPageSize;
    return this.filtered.slice(start, start + this.adminPageSize);
  }

  get totalPages() { return Math.ceil(this.filtered.length / this.adminPageSize); }
  prevPage() { if (this.adminPage > 0) this.adminPage--; }
  nextPage() { if (this.adminPage < this.totalPages - 1) this.adminPage++; }

  isProfileComplete(c: AdminClinic): boolean {
    return c.image_count > 0 && c.service_count > 0 && c.has_address;
  }

  profileScore(c: AdminClinic): number {
    return [c.image_count > 0, c.service_count > 0, c.has_address, c.has_description]
      .filter(Boolean).length;
  }

  setStatus(id: number, status: 'active' | 'pending' | 'suspended') {
    this.http.patch(`${API}/admin/clinics/${id}/status`, { status }, { headers: this.headers() }).subscribe({
      next: () => {
        const c = this.clinics.find(x => x.id === id);
        if (c) { c.status = status; this.applyFilter(); }
      },
    });
  }

  confirmDelete(id: number) {
    this.confirmDeleteId = id;
  }

  cancelDelete() {
    this.confirmDeleteId = null;
  }

  deleteClinic(id: number) {
    this.http.delete(`${API}/admin/clinics/${id}`, { headers: this.headers() }).subscribe({
      next: () => {
        this.clinics = this.clinics.filter(c => c.id !== id);
        this.applyFilter();
        this.confirmDeleteId = null;
      },
    });
  }

  get pendingCount()     { return this.clinics.filter(c => c.status === 'pending').length; }
  get activeCount()      { return this.clinics.filter(c => c.status === 'active').length; }
  get suspendedCount()   { return this.clinics.filter(c => c.status === 'suspended').length; }
  get neverLoggedCount() { return this.clinics.filter(c => !c.last_login_at).length; }
  get notVerifiedCount() { return this.clinics.filter(c => c.user_id && !c.email_verified).length; }
  get incompleteCount()  { return this.clinics.filter(c => !this.isProfileComplete(c)).length; }

  createClinicAccounts() {
    if (!confirm('Creezi conturi pentru toate clinicile fără user? Parolele vor fi afișate o singură dată — salvează-le!')) return;
    this.creatingAccounts = true;
    this.accountsResult = null;
    this.http.post<any>(`${API}/admin/create-clinic-accounts`, {}, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.creatingAccounts = false;
        this.accountsResult = res.results;
        this.load();
      },
      error: (err) => {
        this.creatingAccounts = false;
        alert('❌ Eroare: ' + (err.error?.error ?? err.message));
      },
    });
  }

  closeAccountsResult() {
    this.accountsResult = null;
  }

  // ── ADD CLINIC ────────────────────────────────────────────
  openAddClinic() {
    this.addClinicForm = { name: '', email: '', city: '', phone: '', plan: 'starter' };
    this.addClinicError = '';
    this.showAddClinic = true;
  }

  closeAddClinic() {
    this.showAddClinic = false;
  }

  submitAddClinic() {
    if (!this.addClinicForm.name.trim() || !this.addClinicForm.email.trim()) {
      this.addClinicError = 'Numele și emailul sunt obligatorii.';
      return;
    }
    this.addingClinic = true;
    this.addClinicError = '';
    this.http.post<any>(`${API}/admin/add-clinic`, this.addClinicForm, { headers: this.headers() }).subscribe({
      next: () => {
        this.addingClinic = false;
        this.showAddClinic = false;
        this.load();
      },
      error: (err) => {
        this.addingClinic = false;
        this.addClinicError = err.error?.error ?? 'Eroare la adăugarea clinicii.';
      },
    });
  }

  // ── BATCH TEST CLINICS ────────────────────────────────────
  addBatchTestClinics() {
    if (!confirm(`Adaugi ${this.TEST_CLINICS.length} clinici de test cu conturi și emailuri?\n\n${this.TEST_CLINICS.map(c => c.email).join('\n')}`)) return;
    this.addingBatch = true;
    this.batchResult = null;
    this.http.post<any>(`${API}/admin/add-batch-clinics`, { clinics: this.TEST_CLINICS }, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.addingBatch = false;
        this.batchResult = res.results;
        this.load();
      },
      error: (err) => {
        this.addingBatch = false;
        alert('❌ Eroare: ' + (err.error?.error ?? err.message));
      },
    });
  }

  closeBatchResult() {
    this.batchResult = null;
  }

  // ── SIMULATE CLINICS ──────────────────────────────────────
  simulateClinics() {
    if (!confirm('Populezi profilul complet (adresă, descriere, servicii, coordonate) pentru cele 4 clinici de test?')) return;
    this.simulating = true;
    this.simulateResult = null;
    this.http.post<any>(`${API}/admin/simulate-clinics`, {}, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.simulating = false;
        this.simulateResult = res.results;
        this.load();
      },
      error: (err) => {
        this.simulating = false;
        alert('❌ Eroare: ' + (err.error?.error ?? err.message));
      },
    });
  }

  closeSimulateResult() {
    this.simulateResult = null;
  }

  // ── RESEND WELCOME EMAILS ─────────────────────────────────
  resendWelcomeEmails() {
    const count = this.clinics.filter(c => c.user_id).length;
    if (!confirm(`Retrimiți emailurile de bun venit (cu parole noi) la toate cele ${count} clinici cu cont?`)) return;
    this.resendingEmails = true;
    this.resendResult = null;
    this.http.post<any>(`${API}/admin/resend-welcome-emails`, {}, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.resendingEmails = false;
        this.resendResult = res.results;
      },
      error: (err) => {
        this.resendingEmails = false;
        alert('❌ Eroare: ' + (err.error?.error ?? err.message));
      },
    });
  }

  closeResendResult() {
    this.resendResult = null;
  }

  runOnboarding() {
    if (!confirm('Creezi conturi noi + trimiți emailuri de bun venit tuturor clinicilor fără cont?')) return;
    this.onboarding = true;
    this.onboardResult = null;
    this.http.post<any>(`${API}/admin/onboard-clinics`, {}, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.onboarding = false;
        this.onboardResult = res.results;
        this.load();
      },
      error: (err) => {
        this.onboarding = false;
        alert('❌ Eroare: ' + (err.error?.error ?? err.message));
      },
    });
  }

  closeOnboardResult() {
    this.onboardResult = null;
  }

  exitToPatient() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatLoginDate(d: string | null): string {
    if (!d) return 'Niciodată';
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `acum ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `acum ${h}h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `acum ${days} zile`;
    return this.formatDate(d);
  }
}
