import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, LowerCasePipe, DatePipe, UpperCasePipe } from '@angular/common';
import { AuthService } from '../auth.service';

const API = '/api';

interface AdminClinic {
  id: number;
  name: string;
  email: string;
  city: string;
  status: 'active' | 'pending' | 'suspended' | 'pending_payment';
  plan: string;
  created_at: string;
  logo_url: string | null;
  phone_public: string;
  stripe_subscription_status: string | null;
  has_address: boolean;
  has_description: boolean;
  user_id: number | null;
  user_email: string | null;
  user_name: string | null;
  email_verified: boolean;
  last_login_at: string | null;
  image_count: number;
  service_count: number;
  review_count: number;
  avg_rating: number | null;
  appointment_count: number;
  views_30d: number;
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
  imports: [FormsModule, DecimalPipe, LowerCasePipe, DatePipe, UpperCasePipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  clinics: AdminClinic[] = [];
  filtered: AdminClinic[] = [];
  isLoading = true;
  filterStatus: 'all' | 'active' | 'pending' | 'suspended' | 'pending_payment' = 'all';
  filterOnboarding: 'all' | 'never_logged' | 'not_verified' | 'incomplete' = 'all';
  filterPlan: 'all' | 'starter' | 'growth' | 'pro' = 'all';
  searchQuery = '';
  confirmDeleteId: number | null = null;
  adminPage = 0;
  readonly adminPageSize = 25;

  // Dev tools dropdown
  showDevTools = false;
  showExportPanel = false;
  creatingAccounts = false;
  onboarding = false;
  onboardResult: any[] | null = null;
  accountsResult: any[] | null = null;
  addingBatch = false;
  batchResult: any[] | null = null;
  simulating = false;
  simulateResult: any[] | null = null;
  resendingEmails = false;
  resendResult: any[] | null = null;
  sendingReengagement = false;
  reengagementResult: any[] | null = null;

  // Add clinic
  showAddClinic = false;
  addingClinic = false;
  addClinicError = '';
  addClinicForm: AddClinicForm = { name: '', email: '', city: '', phone: '', plan: 'starter' };

  // Email completare profil
  sendingProfileEmails = false;
  profileEmailsResult: any[] | null = null;

  // Email stats
  emailStats: any | null = null;
  emailStatsLoading = false;

  // Platform stats
  platformStats: any | null = null;

  // Business overview
  businessOverview: any | null = null;
  businessOverviewLoading = false;

  // Reactivation stats
  reactivationStats: any | null = null;
  reactivationLoading = false;

  // Feedback
  feedbackList: any[] | null = null;

  // Support messages
  supportMessages: any[] | null = null;
  openThreadId: number | null = null;

  get unreadMessages(): number {
    return this.supportMessages?.filter(m => !m.is_read).length ?? 0;
  }

  readonly DEV_EMAILS = ['adminclinica@dentipro.ro', 'adminpacient@dentipro.ro'];

  creatingDevAccounts = false;
  devAccountsResult: any | null = null;

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
    if (!this.auth.isAdmin) {
      this.router.navigate(['/']);
      return;
    }
    this.load();
    this.loadPlatformStats();
    this.loadBusinessOverview();
    this.loadReactivationStats();
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
        console.error('[Admin] Eroare:', err.status, err.message);
        this.isLoading = false;
      },
    });
  }

  applyFilter() {
    const base = this.clinics.filter(c => !this.DEV_EMAILS.includes(c.email?.toLowerCase()));
    this.recomputeCounts(base);

    let list = base;
    if (this.filterStatus !== 'all') list = list.filter(c => c.status === this.filterStatus);
    if (this.filterPlan !== 'all') list = list.filter(c => c.plan === this.filterPlan);
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
    this.updatePage();
  }

  private recomputeCounts(clinics: AdminClinic[]): void {
    let pending = 0, active = 0, suspended = 0, pendingPayment = 0;
    let neverLogged = 0, notVerified = 0, incomplete = 0;
    let starter = 0, growth = 0, pro = 0, paid = 0, pastDue = 0;

    for (const c of clinics) {
      if (c.status === 'pending') pending++;
      else if (c.status === 'active') active++;
      else if (c.status === 'suspended') suspended++;
      else if (c.status === 'pending_payment') pendingPayment++;

      if (!c.last_login_at) neverLogged++;
      if (c.user_id && !c.email_verified) notVerified++;
      if (!this.isProfileComplete(c)) incomplete++;

      if (c.plan === 'starter') starter++;
      else if (c.plan === 'growth') { growth++; paid++; }
      else if (c.plan === 'pro') { pro++; paid++; }

      if (c.stripe_subscription_status === 'past_due') pastDue++;
    }

    this.pendingCount = pending;
    this.activeCount = active;
    this.suspendedCount = suspended;
    this.pendingPaymentCount = pendingPayment;
    this.neverLoggedCount = neverLogged;
    this.notVerifiedCount = notVerified;
    this.incompleteCount = incomplete;
    this.starterCount = starter;
    this.growthCount = growth;
    this.proCount = pro;
    this.paidCount = paid;
    this.pastDueCount = pastDue;
  }

  // Array paginat explicit — nu getter (evita re-render la fiecare CD cycle)
  pagedClinics: AdminClinic[] = [];

  private updatePage() {
    const start = this.adminPage * this.adminPageSize;
    this.pagedClinics = this.filtered.slice(start, start + this.adminPageSize);
  }

  get totalPages() { return Math.ceil(this.filtered.length / this.adminPageSize); }
  prevPage() { if (this.adminPage > 0) { this.adminPage--; this.updatePage(); } }
  nextPage() { if (this.adminPage < this.totalPages - 1) { this.adminPage++; this.updatePage(); } }

  private hasClinicMedia(c: AdminClinic): boolean {
    return c.image_count > 0 || !!c.logo_url;
  }

  isProfileComplete(c: AdminClinic): boolean {
    return this.hasClinicMedia(c) && c.service_count > 0 && c.has_address;
  }

  profileScore(c: AdminClinic): number {
    return [this.hasClinicMedia(c), c.service_count > 0, c.has_address, c.has_description]
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

  confirmDelete(id: number) { this.confirmDeleteId = id; }
  cancelDelete() { this.confirmDeleteId = null; }

  deleteClinic(id: number) {
    this.http.delete(`${API}/admin/clinics/${id}`, { headers: this.headers() }).subscribe({
      next: () => {
        this.clinics = this.clinics.filter(c => c.id !== id);
        this.applyFilter();
        this.confirmDeleteId = null;
      },
    });
  }

  pendingCount = 0;
  activeCount = 0;
  suspendedCount = 0;
  pendingPaymentCount = 0;
  neverLoggedCount = 0;
  notVerifiedCount = 0;
  incompleteCount = 0;
  starterCount = 0;
  growthCount = 0;
  proCount = 0;
  paidCount = 0;
  pastDueCount = 0;

  // ── ADD CLINIC ────────────────────────────────────────────
  openAddClinic() {
    this.addClinicForm = { name: '', email: '', city: '', phone: '', plan: 'starter' };
    this.addClinicError = '';
    this.showAddClinic = true;
  }

  closeAddClinic() { this.showAddClinic = false; }

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

  // ── EMAIL COMPLETARE PROFIL ───────────────────────────────
  sendCompleteProfileEmails() {
    const count = this.clinics.filter(c => !this.isProfileComplete(c)).length;
    if (!confirm(`Trimiți emailuri de completare profil la ${count} clinici cu profil incomplet?`)) return;
    this.sendingProfileEmails = true;
    this.profileEmailsResult = null;
    this.http.post<any>(`${API}/admin/send-complete-profile`, {}, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.sendingProfileEmails = false;
        this.profileEmailsResult = res.results;
      },
      error: (err) => {
        this.sendingProfileEmails = false;
        alert('❌ Eroare: ' + (err.error?.error ?? err.message));
      },
    });
  }

  closeProfileEmailsResult() { this.profileEmailsResult = null; }

  // ── SUPPORT MESSAGES ──────────────────────────────────────
  loadSupportMessages() {
    this.http.get<any[]>(`${API}/admin/support-messages`, { headers: this.headers() }).subscribe({
      next: (data) => { this.supportMessages = data; },
      error: (err) => { alert('❌ Eroare: ' + (err.error?.error ?? err.message)); },
    });
  }

  toggleThread(id: number) {
    this.openThreadId = this.openThreadId === id ? null : id;
  }

  replyToMessage(m: any) {
    if (!m._replyDraft?.trim()) return;
    m._sending = true;
    this.http.post(`${API}/admin/support-messages/${m.id}/reply`, { reply: m._replyDraft }, { headers: this.headers() }).subscribe({
      next: () => {
        if (!m.replies) m.replies = [];
        m.replies.push({ sender: 'admin', body: m._replyDraft, created_at: new Date().toISOString() });
        m.is_read = true;
        m._replyDraft = '';
        m._sending = false;
      },
      error: (err) => {
        m._sending = false;
        alert('❌ ' + (err.error?.error ?? err.message));
      },
    });
  }

  closeThread(m: any) {
    this.http.patch(`${API}/admin/support-messages/${m.id}/close`, {}, { headers: this.headers() }).subscribe({
      next: () => { m.status = 'closed'; m.is_read = true; },
    });
  }

  reopenThread(m: any) {
    this.http.patch(`${API}/admin/support-messages/${m.id}/reopen`, {}, { headers: this.headers() }).subscribe({
      next: () => { m.status = 'open'; },
    });
  }

  // ── FEEDBACK ──────────────────────────────────────────────
  loadFeedbacks() {
    this.http.get<any[]>(`${API}/admin/feedbacks`, { headers: this.headers() }).subscribe({
      next: (data) => { this.feedbackList = data; },
      error: (err) => { alert('❌ Eroare: ' + (err.error?.error ?? err.message)); },
    });
  }

  // ── DEV TOOLS ─────────────────────────────────────────────
  createClinicAccounts() {
    if (!confirm('Creezi conturi pentru toate clinicile fără user? Parolele vor fi afișate o singură dată — salvează-le!')) return;
    this.creatingAccounts = true;
    this.accountsResult = null;
    this.http.post<any>(`${API}/admin/create-clinic-accounts`, {}, { headers: this.headers() }).subscribe({
      next: (res) => { this.creatingAccounts = false; this.accountsResult = res.results; this.load(); },
      error: (err) => { this.creatingAccounts = false; alert('❌ Eroare: ' + (err.error?.error ?? err.message)); },
    });
  }

  closeAccountsResult() { this.accountsResult = null; }

  addBatchTestClinics() {
    if (!confirm(`Adaugi ${this.TEST_CLINICS.length} clinici de test cu conturi și emailuri?\n\n${this.TEST_CLINICS.map(c => c.email).join('\n')}`)) return;
    this.addingBatch = true;
    this.batchResult = null;
    this.http.post<any>(`${API}/admin/add-batch-clinics`, { clinics: this.TEST_CLINICS }, { headers: this.headers() }).subscribe({
      next: (res) => { this.addingBatch = false; this.batchResult = res.results; this.load(); },
      error: (err) => { this.addingBatch = false; alert('❌ Eroare: ' + (err.error?.error ?? err.message)); },
    });
  }

  closeBatchResult() { this.batchResult = null; }

  simulateClinics() {
    if (!confirm('Populezi profilul complet pentru cele 4 clinici de test?')) return;
    this.simulating = true;
    this.simulateResult = null;
    this.http.post<any>(`${API}/admin/simulate-clinics`, {}, { headers: this.headers() }).subscribe({
      next: (res) => { this.simulating = false; this.simulateResult = res.results; this.load(); },
      error: (err) => { this.simulating = false; alert('❌ Eroare: ' + (err.error?.error ?? err.message)); },
    });
  }

  closeSimulateResult() { this.simulateResult = null; }

  resendWelcomeEmails() {
    const count = this.clinics.filter(c => c.user_id).length;
    if (!confirm(`Retrimiți emailurile de bun venit (cu parole noi) la toate cele ${count} clinici cu cont?`)) return;
    this.resendingEmails = true;
    this.resendResult = null;
    this.http.post<any>(`${API}/admin/resend-welcome-emails`, {}, { headers: this.headers() }).subscribe({
      next: (res) => { this.resendingEmails = false; this.resendResult = res.results; },
      error: (err) => { this.resendingEmails = false; alert('❌ Eroare: ' + (err.error?.error ?? err.message)); },
    });
  }

  closeResendResult() { this.resendResult = null; }

  sendReengagementEmails() {
    const count = this.clinics.filter(c => c.user_id && !c.email_verified).length;
    if (!confirm(`Trimiți emailul de reactivare la ${count} clinici cu email neverificat?`)) return;
    this.sendingReengagement = true;
    this.reengagementResult = null;
    this.http.post<any>(`${API}/admin/send-reengagement-emails`, { loginUrl: 'https://www.dentipro.ro/clinici/autentificare' }, { headers: this.headers() }).subscribe({
      next: (res) => { this.sendingReengagement = false; this.reengagementResult = res.results; },
      error: (err) => { this.sendingReengagement = false; alert('❌ Eroare: ' + (err.error?.error ?? err.message)); },
    });
  }

  closeReengagementResult() { this.reengagementResult = null; }

  createDevAccounts() {
    if (!confirm('Creezi/resetezi conturile dev adminclinica + adminpacient cu parola "banubada"?')) return;
    this.creatingDevAccounts = true;
    this.devAccountsResult = null;
    const body = {
      clinic:  { email: 'adminclinica@dentipro.ro',  name: 'Admin Clinică',  role: 'clinic',  password: 'banubada' },
      patient: { email: 'adminpacient@dentipro.ro',  name: 'Admin Pacient',  role: 'patient', password: 'banubada' },
    };
    this.http.post<any>(`${API}/admin/create-dev-accounts`, body, { headers: this.headers() }).subscribe({
      next: (res) => { this.creatingDevAccounts = false; this.devAccountsResult = res; },
      error: (err) => { this.creatingDevAccounts = false; alert('❌ Eroare: ' + (err.error?.error ?? err.message)); },
    });
  }

  closeDevAccountsResult() { this.devAccountsResult = null; }

  runOnboarding() {
    if (!confirm('Creezi conturi noi + trimiți emailuri de bun venit tuturor clinicilor fără cont?')) return;
    this.onboarding = true;
    this.onboardResult = null;
    this.http.post<any>(`${API}/admin/onboard-clinics`, {}, { headers: this.headers() }).subscribe({
      next: (res) => { this.onboarding = false; this.onboardResult = res.results; this.load(); },
      error: (err) => { this.onboarding = false; alert('❌ Eroare: ' + (err.error?.error ?? err.message)); },
    });
  }

  closeOnboardResult() { this.onboardResult = null; }

  // ── PLATFORM STATS ────────────────────────────────────────
  loadPlatformStats() {
    this.http.get<any>(`${API}/admin/platform-stats`, { headers: this.headers() }).subscribe({
      next: (data) => { this.platformStats = data; },
      error: () => {},
    });
  }

  loadBusinessOverview() {
    this.businessOverviewLoading = true;
    this.http.get<any>(`${API}/admin/business-overview`, { headers: this.headers() }).subscribe({
      next: (data) => { this.businessOverview = data; this.businessOverviewLoading = false; },
      error: () => { this.businessOverviewLoading = false; },
    });
  }

  get maxDailyClinic(): number {
    if (!this.businessOverview?.dailyNewClinics?.length) return 1;
    return Math.max(1, ...this.businessOverview.dailyNewClinics.map((d: any) => d.new_clinics));
  }

  // ── REACTIVATION STATS ────────────────────────────────────
  loadReactivationStats() {
    this.reactivationLoading = true;
    this.http.get<any>(`${API}/admin/reactivation-stats`, { headers: this.headers() }).subscribe({
      next: (data) => { this.reactivationStats = data; this.reactivationLoading = false; },
      error: () => { this.reactivationLoading = false; },
    });
  }

  get maxDailyLogin(): number {
    if (!this.reactivationStats?.dailyLogins?.length) return 1;
    return Math.max(1, ...this.reactivationStats.dailyLogins.map((d: any) => d.logged_in));
  }

  get totalClinicUsers(): number {
    const b = this.reactivationStats?.buckets;
    if (!b) return 0;
    return (+b.never_logged) + (+b.inactive_30d) + (+b.active_7_30d) + (+b.active_7d);
  }

  bucketPct(val: number): number {
    const t = this.totalClinicUsers;
    return t > 0 ? Math.round((val / t) * 100) : 0;
  }

  formatDayLabel(day: string): string {
    const d = new Date(day);
    return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
  }

  // ── EMAIL STATS ───────────────────────────────────────────
  loadEmailStats() {
    this.emailStatsLoading = true;
    this.emailStats = null;
    this.http.get<any>(`${API}/admin/email-stats`, { headers: this.headers() }).subscribe({
      next: (data) => { this.emailStats = data; this.emailStatsLoading = false; },
      error: (err) => { this.emailStatsLoading = false; alert('❌ ' + (err.error?.error ?? err.message)); },
    });
  }

  get totalEmailsSent(): number {
    return this.emailStats?.byType?.reduce((s: number, r: any) => s + Number(r.total_sent), 0) ?? 0;
  }

  emailTypeLabel(type: string): string {
    const map: Record<string, string> = {
      appt_reminder: 'Reminder programare',
      review_request: 'Cerere recenzie',
      patient_reengagement: 'Re-engagement pacient',
      clinic_no_activity: 'Fără activitate (clinică)',
      clinic_open_requests: 'Digest cereri deschise',
      clinic_profile_reminder: 'Reminder profil',
      clinic_onboarding: 'Onboarding clinică',
      payment_failed: 'Plată eșuată',
      subscription_canceled: 'Abonament anulat',
    };
    return map[type] ?? type;
  }

  exitToPatient() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatTime(d: string | null): string {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
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

  // ── EXPORT CLINICI INACTIVE ───────────────────────────────
  exportingInactive = false;
  exportInactiveDays = 0;
  exportInactiveStatus = '';
  exportInactivePlan = '';

  exportInactiveClinics() {
    this.exportingInactive = true;
    const params: string[] = [];
    if (this.exportInactiveDays > 0) params.push(`days=${this.exportInactiveDays}`);
    if (this.exportInactiveStatus) params.push(`status=${this.exportInactiveStatus}`);
    if (this.exportInactivePlan) params.push(`plan=${this.exportInactivePlan}`);
    const qs = params.length ? `?${params.join('&')}` : '';

    this.http.get(`${API}/admin/export/inactive-clinics${qs}`, {
      headers: this.headers(),
      responseType: 'blob',
    }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inactive-clinics-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportingInactive = false;
      },
      error: (err) => {
        this.exportingInactive = false;
        alert('❌ Export eșuat: ' + (err.error?.error ?? err.message));
      },
    });
  }

  // ── REWARD POINTS ADMIN ──────────────────────────────────
  showPointsPanel = false;
  pointsPatients: any[] = [];
  pointsLoading = false;
  selectedPatientPoints: { userId: number; name: string; history: any[] } | null = null;
  historyLoading = false;
  manualPts = 0;
  manualDesc = '';
  manualSaving = false;
  manualError = '';

  loadPointsPanel() {
    this.showPointsPanel = true;
    this.pointsLoading = true;
    this.http.get<any[]>(`${API}/admin/points`, { headers: this.headers() }).subscribe({
      next: (data) => { this.pointsPatients = data; this.pointsLoading = false; },
      error: () => { this.pointsLoading = false; },
    });
  }

  openPatientHistory(userId: number, name: string) {
    this.selectedPatientPoints = { userId, name, history: [] };
    this.historyLoading = true;
    this.manualPts = 0;
    this.manualDesc = '';
    this.manualError = '';
    this.http.get<any[]>(`${API}/admin/points/${userId}/history`, { headers: this.headers() }).subscribe({
      next: (h) => { this.selectedPatientPoints!.history = h; this.historyLoading = false; },
      error: () => { this.historyLoading = false; },
    });
  }

  saveManualPoints() {
    if (!this.manualPts || !this.manualDesc.trim()) { this.manualError = 'Completează toate câmpurile.'; return; }
    this.manualSaving = true;
    this.manualError = '';
    const userId = this.selectedPatientPoints!.userId;
    this.http.post<any>(`${API}/admin/points/${userId}`,
      { points: this.manualPts, description: this.manualDesc.trim() },
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.manualSaving = false;
        this.manualPts = 0;
        this.manualDesc = '';
        // Refresh
        this.openPatientHistory(userId, this.selectedPatientPoints!.name);
        this.loadPointsPanel();
      },
      error: (err) => {
        this.manualError = err.error?.error || 'Eroare la salvare.';
        this.manualSaving = false;
      },
    });
  }

  levelClass(name: string): string {
    return name.toLowerCase();
  }

  // ── PROGRAM PARTENER ─────────────────────────────────────
  sendingPartnerEmails = false;
  showPartnerPanel = false;
  partnerApps: any[] = [];
  partnerLoading = false;
  expandedPartner: number | null = null;

  loadPartnerPanel() {
    this.showPartnerPanel = true;
    this.partnerLoading = true;
    this.http.get<any[]>(`${API}/admin/partner-applications`, { headers: this.headers() }).subscribe({
      next: (data) => { this.partnerApps = data; this.partnerLoading = false; },
      error: () => { this.partnerLoading = false; },
    });
  }

  updatePartnerStatus(id: number, status: string) {
    this.http.patch(`${API}/admin/partner-applications/${id}/status`, { status }, { headers: this.headers() }).subscribe({
      next: () => {
        const app = this.partnerApps.find(a => a.id === id);
        if (app) app.status = status;
      },
    });
  }

  partnerBeneficii(app: any): string {
    if (!app.beneficii) return '—';
    return Object.entries(app.beneficii)
      .filter(([k, v]) => v && k !== 'alt')
      .map(([k]) => k.replace(/_/g, ' '))
      .concat(app.beneficii.alt ? [`Alt: ${app.beneficii.alt}`] : [])
      .join(', ') || '—';
  }

  partnerServicii(app: any): string {
    if (!app.servicii) return '—';
    return Object.entries(app.servicii).filter(([,v]) => v).map(([k]) => k).join(', ') || '—';
  }

  partnerModel(app: any): string {
    if (!app.model_business) return '—';
    return Object.entries(app.model_business).filter(([,v]) => v).map(([k]) => k.replace(/_/g,' ')).join(', ') || '—';
  }

  partnerReducere(app: any): string {
    if (!app.reducere) return '—';
    const vals: string[] = [];
    if (app.reducere.p5) vals.push('5%');
    if (app.reducere.p10) vals.push('10%');
    if (app.reducere.p15) vals.push('15%');
    if (app.reducere.p20) vals.push('20%');
    if (app.reducere.alta) vals.push(`Alta: ${app.reducere.alta || ''}`);
    return vals.join(', ') || '—';
  }

  partnerStatusColor(s: string): string {
    return { new: '#60a5fa', contacted: '#fbbf24', signed: '#4ade80', rejected: '#f87171' }[s] ?? '#94a3b8';
  }

  sendPartnerTestEmail() {
    // Trimite DOAR la Stomadent (ID 116, alec.constant04@icloud.com)
    if (!confirm('Trimiți emailul de test parteneriat DOAR la Stomadent (alec.constant04@icloud.com)?')) return;
    this.sendingPartnerEmails = true;
    this.http.post<any>(`${API}/admin/send-partnership-email`, { clinicIds: [116] }, { headers: this.headers() }).subscribe({
      next: (r) => {
        this.sendingPartnerEmails = false;
        alert(`✅ Email de test trimis la Stomadent (${r.sent} din ${r.total}).`);
      },
      error: (e) => {
        this.sendingPartnerEmails = false;
        alert('❌ Eroare: ' + (e.error?.error ?? 'necunoscut'));
      },
    });
  }

  sendPartnerEmails() {
    if (!confirm('Trimiți emailul de invitație partener la TOATE clinicile active? Confirmă.')) return;
    this.sendingPartnerEmails = true;
    this.http.post<any>(`${API}/admin/send-partnership-email`, {}, { headers: this.headers() }).subscribe({
      next: (r) => {
        this.sendingPartnerEmails = false;
        alert(`✅ Trimis cu succes la ${r.sent} din ${r.total} clinici.`);
      },
      error: (e) => {
        this.sendingPartnerEmails = false;
        alert('❌ Eroare: ' + (e.error?.error ?? 'necunoscut'));
      },
    });
  }
}
