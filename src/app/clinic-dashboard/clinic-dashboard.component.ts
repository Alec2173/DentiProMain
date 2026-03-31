import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../auth.service';

const API = 'https://www.dentipro.ro/api';

@Component({
  selector: 'app-clinic-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
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

  constructor(private http: HttpClient, public auth: AuthService, private router: Router) {}

  get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  // ── CERERI DIN ORAȘ ────────────────────────────────────────
  cityPosts: any[] = [];
  cityPostsLoading = false;

  ngOnInit() {
    if (!this.auth.isClinic) { this.router.navigate(['/clinici']); return; }
    if (!this.auth.currentUser?.clinicId) { this.router.navigate(['/clinici/inscriere']); return; }
    this.load();
    this.initFeedback();
    this.loadMessages();
    this.loadClinicReviews();
    this.loadBeforeAfter();
    this.loadCityPosts();
  }

  ngOnDestroy() {
    clearTimeout(this.feedbackTimer);
  }

  private get fbKey(): string { return `dp_feedback_${this.auth.currentUser?.id}`; }

  private initFeedback() {
    const state = localStorage.getItem(this.fbKey);
    // 'submitted' or 'done' → never show again
    if (state === 'submitted' || state === 'done') return;

    // Check backend: maybe they submitted from another device
    this.http.get<{ submitted: boolean }>(`${API}/feedback/clinic/check?clinicId=${this.auth.currentUser?.clinicId}`)
      .subscribe({
        next: (r) => {
          if (r.submitted) { localStorage.setItem(this.fbKey, 'submitted'); return; }
          this.scheduleFeedback(state);
        },
        error: () => this.scheduleFeedback(state),
      });
  }

  private scheduleFeedback(_state: string | null) {
    // skip2 (already skipped once before) → schedule once more, then mark done
    // no state → schedule normally
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
    this.http.post(`${API}/feedback/clinic`, body).subscribe({
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
    this.http.get<any>(`${API}/clinic-dashboard`, { headers: this.headers }).subscribe({
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
    this.http.patch(`${API}/appointments/${id}/status`, { status }, { headers: this.headers }).subscribe({
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
    this.http.get<any[]>(`${API}/messages/clinic`, { headers: this.headers }).subscribe({
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
      this.http.patch(`${API}/messages/${msg.id}/read`, {}, { headers: this.headers }).subscribe({
        next: () => { msg.read_at = new Date().toISOString(); }
      });
    }
  }

  sendReply(msg: any) {
    const text = (this.replyText[msg.id] || '').trim();
    if (!text) return;
    this.replySending = msg.id;
    this.http.post(`${API}/messages/${msg.id}/reply`, { reply: text }, { headers: this.headers }).subscribe({
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
    this.http.get<any[]>(`${API}/feed/clinic-city`, { headers: this.headers }).subscribe({
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
    this.http.get<any>(`${API}/reviews/clinic/${clinicId}`, { headers: this.headers }).subscribe({
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
    this.http.get<any[]>(`${API}/clinics/${clinicId}/before-after`).subscribe({
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

    this.http.post<any>(`${API}/clinics/${clinicId}/before-after`, fd, { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` }) }).subscribe({
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
    this.http.delete(`${API}/clinics/${clinicId}/before-after/${id}`, { headers: this.headers }).subscribe({
      next: () => {
        this.beforeAfterList = this.beforeAfterList.filter(b => b.id !== id);
        this.baDeletingId = null;
      },
      error: () => { this.baDeletingId = null; },
    });
  }
}
