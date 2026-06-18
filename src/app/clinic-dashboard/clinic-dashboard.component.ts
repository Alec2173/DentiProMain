import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../auth.service';

const API = '/api';

@Component({
  selector: 'app-clinic-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './clinic-dashboard.component.html',
  styleUrl: './clinic-dashboard.component.css',
})
export class ClinicDashboardComponent implements OnInit, OnDestroy {
  data: any = null;
  isLoading = true;
  updatingApptId: number | null = null;
  apptTab: 'pending' | 'all' = 'pending';

  // ── FEEDBACK POPUP ────────────────────────────────────────
  showFeedback = false;
  feedbackSubmitted = false;
  feedbackSubmitting = false;
  feedbackRating = 0;
  feedbackHover = 0;
  feedbackSuggestions: string[] = [];
  feedbackOther = '';
  private feedbackTimer: any;
  private destroy$ = new Subject<void>();

  // ── CACHED COMPUTED ───────────────────────────────────────
  _calendarDays: { date: string; day: number; isToday: boolean; hasAvailable: boolean; hasBooked: boolean; isPast: boolean }[] = [];
  _calAvailableDates = new Set<string>();
  _calBookedDates = new Set<string>();

  readonly FEATURES = [
    { id: 'programari_auto',    label: 'Programări online cu confirmare automată' },
    { id: 'sms_pacienti',       label: 'Notificări SMS pentru pacienți' },
    { id: 'statistici',         label: 'Rapoarte și statistici detaliate' },
    { id: 'recenzii',           label: 'Sistem de recenzii verificate' },
    { id: 'chat',               label: 'Chat direct cu pacienții' },
    { id: 'calendar',           label: 'Integrare calendar Google / Outlook' },
    { id: 'oferte',             label: 'Oferte și promoții vizibile pentru pacienți' },
    { id: 'lista_asteptare',    label: 'Gestionare listă de așteptare' },
    { id: 'followup',           label: 'Emailuri automate de follow-up post-consultație' },
    { id: 'facturare',          label: 'Facturare și evidență plăți' },
  ];

  constructor(
    private http: HttpClient,
    public auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  // ── CERERI DIN ORAȘ ────────────────────────────────────────
  cityPosts: any[] = [];
  cityPostsLoading = false;

  // ── STATISTICI VIZUALIZĂRI ─────────────────────────────────
  profileViews: { total: number; last7days: number; last30days: number } | null = null;
  viewsChart: { date: string; count: number }[] = [];
  viewsTrend: number = 0; // % față de perioada precedentă

  // ── PROMOȚII ACTIVE ─────────────────────────────────────────
  activePromoCount = 0;

  // ── STRIPE / ABONAMENT ───────────────────────────────────────
  subscription: {
    plan: string;
    status: string;
    subscriptionId: string | null;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
    hasStripe: boolean;
  } | null = null;
  stripePortalLoading = false;
  checkoutSuccessToast = false;
  stripePortalError = false;

  ngOnInit() {
    if (!this.auth.isClinic) { this.router.navigate(['/clinici']); return; }
    if (!this.auth.currentUser?.clinicId) { this.router.navigate(['/clinici/inscriere']); return; }
    this.rebuildCalCache();
    this.load();
    this.checkCompetitorBannerDismissed();
    this.initFeedback();
    this.loadMessages();
    this.loadClinicReviews();
    this.loadBeforeAfter();
    this.loadCityPosts();
    this.loadProfileViews();
    this.loadActivePromos();
    this.loadSubscription();
    this.checkCheckoutSuccess();
    this.loadStock();
    this.loadInvoices();
    this.loadCalSlots();
    this.loadCalBookings();
  }

  ngOnDestroy() {
    clearTimeout(this.feedbackTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private get fbKey(): string { return `dp_feedback_${this.auth.currentUser?.id}`; }

  private initFeedback() {
    const state = localStorage.getItem(this.fbKey);
    // 'submitted' or 'done' → never show again
    if (state === 'submitted' || state === 'done') return;

    // Check backend: maybe they submitted from another device
    this.http.get<{ submitted: boolean }>(`${API}/feedback/clinic/check?clinicId=${this.auth.currentUser?.clinicId}`)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (r) => {
          if (r.submitted) { localStorage.setItem(this.fbKey, 'submitted'); return; }
          this.scheduleFeedback(state);
        },
        error: () => this.scheduleFeedback(state),
      });
  }

  private scheduleFeedback(_state: string | null) {
    clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => { this.showFeedback = true; }, 20000);
  }

  closeFeedback() {
    this.showFeedback = false;
    clearTimeout(this.feedbackTimer);
    const current = localStorage.getItem(this.fbKey);
    if (current === 'skip1') {
      localStorage.setItem(this.fbKey, 'done');
    } else if (!current) {
      localStorage.setItem(this.fbKey, 'skip1');
    }
  }

  toggleFeature(id: string) {
    const idx = this.feedbackSuggestions.indexOf(id);
    if (idx > -1) this.feedbackSuggestions.splice(idx, 1);
    else this.feedbackSuggestions.push(id);
  }

  hasFeature(id: string) { return this.feedbackSuggestions.includes(id); }

  submitFeedback() {
    if (!this.feedbackRating) return;
    this.feedbackSubmitting = true;
    const body = {
      clinicId: this.auth.currentUser?.clinicId,
      clinicName: this.auth.currentUser?.name,
      rating: this.feedbackRating,
      features: this.feedbackSuggestions,
      other: this.feedbackOther.trim() || null,
    };
    this.http.post(`${API}/feedback/clinic`, body).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.feedbackSubmitting = false;
        this.feedbackSubmitted = true;
        localStorage.setItem(this.fbKey, 'submitted');
        setTimeout(() => { this.showFeedback = false; clearTimeout(this.feedbackTimer); }, 2500);
      },
      error: () => {
        this.feedbackSubmitting = false;
        this.feedbackSubmitted = true;
        localStorage.setItem(this.fbKey, 'submitted');
        setTimeout(() => { this.showFeedback = false; clearTimeout(this.feedbackTimer); }, 2500);
      },
    });
  }

  load() {
    this.http.get<any>(`${API}/clinic-dashboard`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (d) => { this.data = d; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  get filteredAppointments(): any[] {
    if (!this.data?.recentAppointments) return [];
    if (this.apptTab === 'pending') return this.data.recentAppointments.filter((a: any) => a.status === 'pending');
    return this.data.recentAppointments;
  }

  updateApptStatus(id: number, status: string) {
    if (this.updatingApptId) return;
    this.updatingApptId = id;
    const appt = this.data.recentAppointments.find((a: any) => a.id === id);
    const wasPending = appt?.status === 'pending';
    this.http.patch(`${API}/appointments/${id}/status`, { status }, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        if (appt) appt.status = status;
        if (wasPending && status !== 'pending') {
          this.data.stats.pendingAppointments = Math.max(0, (this.data.stats.pendingAppointments || 1) - 1);
        }
        this.updatingApptId = null;
      },
      error: () => { this.updatingApptId = null; }
    });
  }

  get profileCompletion(): number {
    if (!this.data?.clinic) return 0;
    const c = this.data.clinic;
    const fields = [c.name, c.email, c.phone_public, c.city, c.address, c.logo_url];
    const filled = fields.filter(Boolean).length;
    const hasImages = this.data.stats.images > 0;
    const hasServices = this.data.stats.services > 0;
    return Math.round(((filled + (hasImages ? 1 : 0) + (hasServices ? 1 : 0)) / 8) * 100);
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getInitials(): string {
    return this.auth.currentUser?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'C';
  }

  getFavoriteUserInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  statusLabel(s: string): string {
    const map: any = { pending: 'În așteptare', confirmed: 'Confirmat', cancelled: 'Anulat', completed: 'Finalizat' };
    return map[s] ?? s;
  }

  // ── MESSAGES ───────────────────────────────────────────────
  messages: any[] = [];
  messagesLoading = false;
  expandedMsgId: number | null = null;
  replyText: { [id: number]: string } = {};
  replySending: number | null = null;

  get unreadCount(): number {
    return this.messages.filter(m => !m.read_at).length;
  }

  loadMessages() {
    this.messagesLoading = true;
    this.http.get<any[]>(`${API}/messages/clinic`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (msgs) => { this.messages = msgs; this.messagesLoading = false; },
      error: () => { this.messagesLoading = false; },
    });
  }

  toggleMsg(msg: any) {
    if (this.expandedMsgId === msg.id) {
      this.expandedMsgId = null;
      return;
    }
    this.expandedMsgId = msg.id;
    if (!msg.read_at) {
      this.http.patch(`${API}/messages/${msg.id}/read`, {}, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { msg.read_at = new Date().toISOString(); }
      });
    }
  }

  sendReply(msg: any) {
    const text = (this.replyText[msg.id] || '').trim();
    if (!text) return;
    this.replySending = msg.id;
    this.http.post(`${API}/messages/${msg.id}/reply`, { reply: text }, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        msg.reply = text;
        msg.replied_at = new Date().toISOString();
        this.replyText[msg.id] = '';
        this.replySending = null;
      },
      error: () => { this.replySending = null; },
    });
  }

  loadCityPosts() {
    this.cityPostsLoading = true;
    this.http.get<any[]>(`${API}/feed/clinic-city`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (posts) => { this.cityPosts = posts; this.cityPostsLoading = false; },
      error: () => { this.cityPostsLoading = false; },
    });
  }

  cityPostServices(post: any): string {
    try {
      const s = Array.isArray(post.services) ? post.services : JSON.parse(post.services ?? '[]');
      return s.slice(0, 3).join(', ');
    } catch { return ''; }
  }

  loadProfileViews() {
    const clinicId = this.auth.currentUser?.clinicId;
    if (!clinicId) return;
    this.http.get<any>(`${API}/clinics/${clinicId}/views`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => { this.profileViews = data; },
      error: () => {},
    });
    this.http.get<{ date: string; count: number }[]>(`${API}/clinics/${clinicId}/views/chart`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.viewsChart = data;
        // Trend: compară ultima săptămână vs săptămâna precedentă
        const last7 = data.slice(-7).reduce((s, d) => s + d.count, 0);
        const prev7 = data.slice(-14, -7).reduce((s, d) => s + d.count, 0);
        this.viewsTrend = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100);
      },
      error: () => {},
    });
  }

  get viewsChartMax(): number {
    return Math.max(...this.viewsChart.map(d => d.count), 1);
  }

  viewBarHeight(count: number): number {
    return Math.max((count / this.viewsChartMax) * 100, count > 0 ? 4 : 1);
  }

  formatChartDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.getDate() + '/' + (d.getMonth() + 1);
  }

  loadActivePromos() {
    const clinicId = this.auth.currentUser?.clinicId;
    if (!clinicId) return;
    this.http.get<any[]>(`${API}/promotions/${clinicId}`).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => { this.activePromoCount = data.length; },
      error: () => {},
    });
  }

  // ── STRIPE / ABONAMENT ───────────────────────────────────────
  loadSubscription() {
    this.http.get<any>(`${API}/stripe/subscription`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => { this.subscription = data; },
      error: () => { this.subscription = { plan: this.data?.clinic?.plan ?? 'starter', status: 'inactive', subscriptionId: null, currentPeriodEnd: null, trialEndsAt: null, hasStripe: false }; },
    });
  }

  openStripePortal() {
    this.stripePortalLoading = true;
    this.http.post<{ portalUrl: string }>(`${API}/stripe/portal`, {}, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { window.location.href = res.portalUrl; },
      error: () => { this.stripePortalLoading = false; this.stripePortalError = true; setTimeout(() => { this.stripePortalError = false; }, 5000); },
    });
  }

  checkCheckoutSuccess() {
    const checkout = this.route.snapshot.queryParamMap.get('checkout');
    if (checkout === 'success') {
      this.checkoutSuccessToast = true;
      // Reload subscription după 2s să preia datele actualizate de webhook
      setTimeout(() => {
        this.loadSubscription();
        this.load(); // reîncarcă dashboard data
      }, 2000);
      setTimeout(() => { this.checkoutSuccessToast = false; }, 6000);
      // Curăță query param din URL fără reload
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  get planLabel(): string {
    const p = this.subscription?.plan ?? this.data?.clinic?.plan ?? 'starter';
    return p.charAt(0).toUpperCase() + p.slice(1);
  }

  get avgServicePrice(): number {
    const completed = this.data?.stats?.completedAppointments ?? 0;
    const value = this.data?.stats?.estimatedValue ?? 0;
    if (completed > 0 && value > 0) return Math.round(value / completed);
    return 280;
  }

  get estimatedMin(): number {
    return Math.round((this.data?.stats?.completedAppointments ?? 0) * this.avgServicePrice * 0.7);
  }

  get estimatedMax(): number {
    return Math.round((this.data?.stats?.completedAppointments ?? 0) * this.avgServicePrice * 1.4);
  }

  get planMonthlyCost(): number {
    const plan = this.subscription?.plan ?? this.data?.clinic?.plan ?? 'starter';
    if (plan === 'growth') return 79;
    if (plan === 'pro') return 149;
    return 0;
  }

  get roiRatio(): number {
    const cost = this.planMonthlyCost;
    const value = this.data?.stats?.estimatedValue ?? 0;
    if (cost === 0 || value === 0) return 0;
    return Math.round(value / cost);
  }

  get performanceTier(): 'none' | 'low' | 'medium' | 'high' {
    const completed = this.data?.stats?.completedAppointments ?? 0;
    const requests = this.data?.stats?.requestsAnswered ?? 0;
    if (completed === 0 && requests === 0) return 'none';
    if (completed >= 5 || requests >= 5) return 'high';
    if (completed >= 2 || requests >= 2) return 'medium';
    return 'low';
  }

  /** Scor global 0-100 bazat pe profil + activitate + vizualizări */
  get overallScore(): number {
    const profile = this.profileCompletion;
    const views   = Math.min(100, (this.profileViews?.last30days ?? 0) * 2);
    const appts   = Math.min(100, (this.data?.stats?.completedAppointments ?? 0) * 10);
    return Math.round((profile * 0.5) + (views * 0.3) + (appts * 0.2));
  }

  get overallScoreLabel(): string {
    const s = this.overallScore;
    if (s >= 80) return 'Excelent';
    if (s >= 60) return 'Bun';
    if (s >= 40) return 'În creștere';
    return 'Începător';
  }

  get overallScoreColor(): string {
    const s = this.overallScore;
    if (s >= 80) return '#4ade80';
    if (s >= 60) return '#fbbf24';
    if (s >= 40) return '#60a5fa';
    return '#f87171';
  }

  get shouldShowUpgradeNudge(): boolean {
    return (this.subscription?.plan === 'starter') &&
      (this.performanceTier === 'medium' || this.performanceTier === 'high');
  }

  get smartActions(): { icon: string; label: string; sub: string; route: string }[] {
    if (!this.data) return [];
    const out: { icon: string; label: string; sub: string; route: string }[] = [];
    const services = this.data?.stats?.services ?? 0;
    const requests = this.data?.stats?.requestsAnswered ?? 0;
    const profile = this.profileCompletion;
    const views = this.profileViews?.last30days ?? 0;
    if (profile < 80) {
      out.push({ icon: 'fa-tasks', label: 'Completează profilul', sub: `${profile}% completat — profilurile complete primesc de 3× mai mulți pacienți`, route: '/clinici/profil' });
    }
    if (services === 0) {
      out.push({ icon: 'fa-tooth', label: 'Adaugă servicii cu prețuri', sub: 'Pacienții filtrează după servicii — fără ele nu apari în rezultate relevante', route: '/clinici/profil' });
    }
    if (requests === 0 && this.cityPosts.length > 0) {
      out.push({ icon: 'fa-comments-alt', label: 'Răspunde la cereri din orașul tău', sub: `${this.cityPosts.length} cereri deschise acum — primul care răspunde câștigă`, route: '/feed' });
    }
    if (views > 0 && views < 15 && profile >= 80 && services > 0) {
      out.push({ icon: 'fa-eye', label: 'Crește vizibilitatea profilului', sub: `Doar ${views} vizualizări luna asta — adaugă o promoție sau mai multe fotografii`, route: '/clinici/profil' });
    }
    if (out.length === 0 && this.data?.stats?.pendingAppointments > 0) {
      out.push({ icon: 'fa-calendar-check', label: 'Confirmă programările în așteptare', sub: `${this.data.stats.pendingAppointments} programări așteaptă răspuns — confirmare rapidă crește satisfacția pacienților`, route: '/clinici/dashboard' });
    }
    return out.slice(0, 3);
  }

  get planStatusLabel(): string {
    const s = this.subscription?.status ?? 'inactive';
    const map: Record<string, string> = {
      active:   'Activ',
      trialing: 'Trial activ',
      past_due: 'Plată restantă',
      canceled: 'Anulat',
      inactive: 'Inactiv',
    };
    return map[s] ?? s;
  }

  formatPeriodEnd(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // ── BEFORE/AFTER ───────────────────────────────────────────
  @ViewChild('baBeforeInput') baBeforeInput!: ElementRef<HTMLInputElement>;
  @ViewChild('baAfterInput') baAfterInput!: ElementRef<HTMLInputElement>;
  beforeAfterList: any[] = [];
  baLoading = false;
  baUploading = false;
  baCaption = '';
  baBeforeFile: File | null = null;
  baAfterFile: File | null = null;
  baBeforePreview: string | null = null;
  baAfterPreview: string | null = null;
  baDeletingId: number | null = null;

  // ── REVIEWS ────────────────────────────────────────────────
  clinicReviews: any[] = [];
  reviewsLoading = false;
  clinicAvgRating: number | null = null;
  clinicReviewCount = 0;

  loadClinicReviews() {
    const clinicId = this.auth.currentUser?.clinicId;
    if (!clinicId) return;
    this.reviewsLoading = true;
    this.http.get<any>(`${API}/reviews/clinic/${clinicId}`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.clinicReviews = res.reviews ?? [];
        this.clinicAvgRating = res.avgRating ?? null;
        this.clinicReviewCount = res.count ?? this.clinicReviews.length;
        this.reviewsLoading = false;
      },
      error: () => { this.reviewsLoading = false; },
    });
  }

  starsArray(): number[] { return [1, 2, 3, 4, 5]; }

  formatReviewDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric', day: '2-digit' });
  }

  // ── BEFORE/AFTER ───────────────────────────────────────────
  loadBeforeAfter() {
    const clinicId = this.auth.currentUser?.clinicId;
    if (!clinicId) return;
    this.baLoading = true;
    this.http.get<any[]>(`${API}/clinics/${clinicId}/before-after`).pipe(takeUntil(this.destroy$)).subscribe({
      next: (list) => { this.beforeAfterList = list; this.baLoading = false; },
      error: () => { this.baLoading = false; },
    });
  }

  onBaFileChange(event: Event, side: 'before' | 'after') {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (side === 'before') { this.baBeforeFile = file; this.baBeforePreview = e.target?.result as string; }
      else { this.baAfterFile = file; this.baAfterPreview = e.target?.result as string; }
    };
    reader.readAsDataURL(file);
  }

  uploadBeforeAfter() {
    if (!this.baBeforeFile || !this.baAfterFile) return;
    const clinicId = this.auth.currentUser?.clinicId;
    if (!clinicId) return;
    this.baUploading = true;

    const fd = new FormData();
    fd.append('before', this.baBeforeFile);
    fd.append('after', this.baAfterFile);
    if (this.baCaption.trim()) fd.append('caption', this.baCaption.trim());

    this.http.post<any>(`${API}/clinics/${clinicId}/before-after`, fd, { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` }) }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (item) => {
        this.beforeAfterList.unshift(item);
        this.baBeforeFile = null; this.baAfterFile = null;
        this.baBeforePreview = null; this.baAfterPreview = null;
        this.baCaption = '';
        if (this.baBeforeInput) this.baBeforeInput.nativeElement.value = '';
        if (this.baAfterInput) this.baAfterInput.nativeElement.value = '';
        this.baUploading = false;
      },
      error: () => { this.baUploading = false; },
    });
  }

  deleteBeforeAfter(id: number) {
    const clinicId = this.auth.currentUser?.clinicId;
    if (!clinicId || this.baDeletingId) return;
    this.baDeletingId = id;
    this.http.delete(`${API}/clinics/${clinicId}/before-after/${id}`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.beforeAfterList = this.beforeAfterList.filter(b => b.id !== id);
        this.baDeletingId = null;
      },
      error: () => { this.baDeletingId = null; },
    });
  }

  // ── PLAN CURENT ────────────────────────────────────────────
  get currentPlan(): string {
    return this.subscription?.plan ?? this.data?.clinic?.plan ?? 'starter';
  }

  // ── PROFILE SCORE CALLOUT ─────────────────────────────────
  get showProfileScoreCallout(): boolean {
    return !!this.data && this.profileCompletion < 80;
  }

  get profileMissingItems(): { label: string; fragment: string }[] {
    if (!this.data?.clinic) return [];
    const c = this.data.clinic;
    const items: { label: string; fragment: string }[] = [];
    if (!c.logo_url) items.push({ label: 'Logo clinică', fragment: 'logo' });
    if (!c.phone_public) items.push({ label: 'Telefon public', fragment: 'contact' });
    if (!c.address) items.push({ label: 'Adresă', fragment: 'adresa' });
    if (!c.city) items.push({ label: 'Oraș', fragment: 'adresa' });
    if (!(this.data.stats?.images > 0)) items.push({ label: 'Fotografii clinică', fragment: 'galerie' });
    if (!(this.data.stats?.services > 0)) items.push({ label: 'Servicii și prețuri', fragment: 'servicii' });
    return items;
  }

  // ── COMPETITOR BANNER ─────────────────────────────────────
  competitorBannerDismissed = false;

  get cityCompetitors(): { total: number; growthCount: number; proCount: number } {
    return this.data?.cityCompetitors ?? { total: 0, growthCount: 0, proCount: 0 };
  }

  get showCompetitorBanner(): boolean {
    if (this.competitorBannerDismissed) return false;
    if (this.currentPlan !== 'starter') return false;
    return this.cityCompetitors.total > 0;
  }

  get competitorBannerText(): string {
    const { total, proCount, growthCount } = this.cityCompetitors;
    const city = this.data?.clinic?.city ?? 'orașul tău';
    if (proCount > 0 && growthCount > 0) {
      return `${proCount} clinici VIP și ${growthCount} clinici Promovat din ${city} apar înaintea ta în rezultate.`;
    }
    if (proCount > 0) {
      return `${proCount} ${proCount === 1 ? 'clinică VIP apare' : 'clinici VIP apar'} înaintea ta în rezultatele din ${city}.`;
    }
    return `${total} ${total === 1 ? 'clinică promovată apare' : 'clinici promovate apar'} înaintea ta în rezultatele din ${city}.`;
  }

  dismissCompetitorBanner() {
    this.competitorBannerDismissed = true;
    try {
      localStorage.setItem(`dp_comp_banner_${this.auth.currentUser?.clinicId}`, new Date().toISOString().slice(0, 10));
    } catch {}
  }

  private checkCompetitorBannerDismissed() {
    try {
      const key = `dp_comp_banner_${this.auth.currentUser?.clinicId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return;
      // Re-afișează după 7 zile
      const daysSince = (Date.now() - new Date(stored).getTime()) / 86400000;
      if (daysSince < 7) this.competitorBannerDismissed = true;
    } catch {}
  }

  // ── MODUL STOCURI (Pro only) ───────────────────────────────
  stockItems: { id: string; name: string; qty: number; unit: string; minQty: number; expiresAt: string | null }[] = [];
  stockLoading = false;
  stockName = '';
  stockQty = 1;
  stockUnit = 'buc';
  stockMinQty = 1;
  stockExpiresAt = '';
  stockError = '';
  showAddStock = false;

  private get clinicIdNum(): number {
    return Number(this.auth.currentUser?.clinicId);
  }

  // ── FACTURI ───────────────────────────────────────────────
  invoices: any[] = [];
  invoicesLoading = false;

  loadInvoices() {
    if (!this.clinicIdNum) return;
    this.invoicesLoading = true;
    this.http.get<any[]>(`${API}/clinics/${this.clinicIdNum}/invoices`, { headers: this.headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.invoices = data; this.invoicesLoading = false; },
        error: () => { this.invoicesLoading = false; },
      });
  }

  downloadInvoice(series: string, number: string) {
    const url = `${API}/invoices/pdf?series=${encodeURIComponent(series)}&number=${encodeURIComponent(number)}`;
    const token = this.auth.getToken();
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `factura-${series}${number}.pdf`;
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(() => {});
  }

  planBillingLabel(plan: string, billingCycle: string): string {
    const names: Record<string, string> = { growth: 'Growth', pro: 'Pro', starter: 'Starter' };
    const cycles: Record<string, string> = { monthly: 'Lunar', annual: 'Anual' };
    return `${names[plan] ?? plan} ${cycles[billingCycle] ?? billingCycle}`;
  }

  loadStock() {
    if (!this.clinicIdNum) return;
    this.stockLoading = true;
    this.http.get<any[]>(`${API}/clinics/${this.clinicIdNum}/stock`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (items) => { this.stockItems = items; this.stockLoading = false; },
      error: () => { this.stockLoading = false; },
    });
  }

  addStockItem() {
    if (!this.stockName.trim()) { this.stockError = 'Numele produsului este obligatoriu.'; return; }
    this.stockError = '';
    const body = {
      name: this.stockName.trim(),
      qty: this.stockQty,
      unit: this.stockUnit,
      minQty: this.stockMinQty,
      expiresAt: this.stockExpiresAt || null,
    };
    this.http.post<any>(`${API}/clinics/${this.clinicIdNum}/stock`, body, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (item) => {
        this.stockItems.unshift(item);
        this.stockName = ''; this.stockQty = 1; this.stockUnit = 'buc';
        this.stockMinQty = 1; this.stockExpiresAt = '';
        this.showAddStock = false;
      },
      error: (err) => { this.stockError = err.error?.error || 'Eroare la salvare.'; },
    });
  }

  deleteStockItem(id: string) {
    this.http.delete(`${API}/clinics/${this.clinicIdNum}/stock/${id}`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.stockItems = this.stockItems.filter(s => s.id !== id); },
    });
  }

  updateStockQty(item: any, delta: number) {
    const newQty = Math.max(0, item.qty + delta);
    this.http.patch(`${API}/clinics/${this.clinicIdNum}/stock/${item.id}`, { qty: newQty }, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { item.qty = newQty; },
    });
  }

  isStockLow(item: any): boolean {
    return item.qty > 0 && item.qty <= item.minQty;
  }

  isStockExpiringSoon(item: any): boolean {
    if (!item.expiresAt) return false;
    const daysLeft = Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / 86_400_000);
    return daysLeft <= 14 && daysLeft > 0;
  }

  isStockExpired(item: any): boolean {
    if (!item.expiresAt) return false;
    return new Date(item.expiresAt) < new Date();
  }

  get stockAlerts(): number {
    return this.stockItems.filter(s => s.qty === 0 || this.isStockLow(s) || this.isStockExpired(s) || this.isStockExpiringSoon(s)).length;
  }

  // ── CALENDAR DISPONIBILITATE ──────────────────────────────
  calSlots: any[] = [];
  calBookings: any[] = [];
  calSlotsLoading = false;
  calSelectedDate = new Date().toISOString().slice(0, 10);
  calNewTime = '09:00';
  calNewDuration = 30;
  calAddError = '';
  calAddLoading = false;
  calUpdatingId: number | null = null;
  calTab: 'slots' | 'bookings' = 'slots';

  get calSlotsForDate(): any[] {
    return this.calSlots.filter(s => s.slot_date?.slice(0, 10) === this.calSelectedDate);
  }

  private rebuildCalCache(): void {
    this._calAvailableDates = new Set(this.calSlots.filter(s => !s.is_booked).map(s => s.slot_date?.slice(0, 10)));
    this._calBookedDates = new Set(this.calSlots.filter(s => s.is_booked).map(s => s.slot_date?.slice(0, 10)));
    this._calendarDays = this.buildCalendarDays();
  }

  private buildCalendarDays(): { date: string; day: number; isToday: boolean; hasAvailable: boolean; hasBooked: boolean; isPast: boolean }[] {
    const days = [];
    const today = new Date().toISOString().slice(0, 10);
    const start = new Date();
    start.setDate(1);
    const stopMonth = start.getMonth() === 11 ? 0 : start.getMonth() + 2;
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d.getMonth() === stopMonth && d.getDate() > 0 && i > 27) break;
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: dateStr,
        day: d.getDate(),
        isToday: dateStr === today,
        hasAvailable: this._calAvailableDates.has(dateStr),
        hasBooked: this._calBookedDates.has(dateStr),
        isPast: dateStr < today,
      });
    }
    return days;
  }

  loadCalSlots() {
    const clinicId = this.auth.currentUser?.clinicId;
    if (!clinicId) return;
    this.calSlotsLoading = true;
    this.http.get<any[]>(`${API}/clinics/${clinicId}/slots?days=90`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (slots) => { this.calSlots = slots; this.calSlotsLoading = false; this.rebuildCalCache(); },
      error: () => { this.calSlotsLoading = false; },
    });
  }

  loadCalBookings() {
    const clinicId = this.auth.currentUser?.clinicId;
    if (!clinicId) return;
    this.http.get<any[]>(`${API}/clinics/${clinicId}/slots/bookings`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (b) => { this.calBookings = b; },
      error: () => {},
    });
  }

  addCalSlot() {
    const clinicId = this.auth.currentUser?.clinicId;
    if (!clinicId || !this.calNewTime || !this.calSelectedDate) return;
    if (this.calSelectedDate < new Date().toISOString().slice(0, 10)) {
      this.calAddError = 'Nu poți adăuga sloturi în trecut.'; return;
    }
    this.calAddError = '';
    this.calAddLoading = true;
    this.http.post<any[]>(`${API}/clinics/${clinicId}/slots`,
      [{ slotDate: this.calSelectedDate, startTime: this.calNewTime, durationMinutes: this.calNewDuration }],
      { headers: this.headers }
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (inserted) => {
        this.calSlots.push(...inserted);
        this.calSlots.sort((a, b) => a.slot_date.localeCompare(b.slot_date) || a.start_time.localeCompare(b.start_time));
        this.calAddLoading = false;
        this.rebuildCalCache();
      },
      error: (err) => { this.calAddError = err?.error?.error || 'Eroare la salvare.'; this.calAddLoading = false; },
    });
  }

  deleteCalSlot(id: number) {
    const clinicId = this.auth.currentUser?.clinicId;
    if (!clinicId) return;
    this.http.delete(`${API}/clinics/${clinicId}/slots/${id}`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.calSlots = this.calSlots.filter(s => s.id !== id); this.rebuildCalCache(); },
      error: () => {},
    });
  }

  updateBookingStatus(id: number, status: 'confirmed' | 'cancelled') {
    if (this.calUpdatingId) return;
    this.calUpdatingId = id;
    this.http.patch(`${API}/slot-bookings/${id}/status`, { status }, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const b = this.calBookings.find(x => x.id === id);
        if (b) b.status = status;
        if (status === 'cancelled') {
          const slot = this.calSlots.find(s => s.id === b?.slot_id);
          if (slot) slot.is_booked = false;
        }
        this.calUpdatingId = null;
      },
      error: () => { this.calUpdatingId = null; },
    });
  }

  formatSlotTime(t: string): string {
    return t ? t.slice(0, 5) : '';
  }

  formatBookingDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  bookingStatusLabel(s: string): string {
    return s === 'confirmed' ? 'Confirmat' : s === 'cancelled' ? 'Anulat' : 'În așteptare';
  }

  get pendingBookingsCount(): number {
    return this.calBookings.filter(b => b.status === 'pending').length;
  }

  readonly calendarWeekdays = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];
}
