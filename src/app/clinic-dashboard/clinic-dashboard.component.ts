import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

const API = 'https://www.dentipro.ro/api';

@Component({
  selector: 'app-clinic-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule],
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

  ngOnInit() {
    if (!this.auth.isClinic) { this.router.navigate(['/clinici']); return; }
    if (!this.auth.currentUser?.clinicId) { this.router.navigate(['/clinici/inscriere']); return; }
    this.load();
    this.initFeedback();
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

  private scheduleFeedback(state: string | null) {
    // skip2 (already skipped once before) → schedule once more, then mark done
    // no state → schedule normally
    this.feedbackTimer = setTimeout(() => { this.showFeedback = true; }, 50000);
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
}
