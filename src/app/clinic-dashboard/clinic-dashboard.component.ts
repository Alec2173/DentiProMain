import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

const API = 'https://www.dentipro.ro/api';

@Component({
  selector: 'app-clinic-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './clinic-dashboard.component.html',
  styleUrl: './clinic-dashboard.component.css',
})
export class ClinicDashboardComponent implements OnInit {
  data: any = null;
  isLoading = true;
  updatingApptId: number | null = null;
  apptTab: 'pending' | 'all' = 'pending';

  constructor(private http: HttpClient, public auth: AuthService, private router: Router) {}

  get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  ngOnInit() {
    if (!this.auth.isClinic) { this.router.navigate(['/clinici']); return; }
    if (!this.auth.currentUser?.clinicId) { this.router.navigate(['/clinici/inscriere']); return; }
    this.load();
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
