import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { RouterLink, Router } from '@angular/router';

const API = 'https://www.dentipro.ro/api';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.css',
})
export class AppointmentsComponent implements OnInit {
  appointments: any[] = [];
  isLoading = true;
  filterStatus: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed' = 'all';

  constructor(private http: HttpClient, public auth: AuthService, private router: Router) {}

  get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  get filtered() {
    if (this.filterStatus === 'all') return this.appointments;
    return this.appointments.filter(a => a.status === this.filterStatus);
  }

  ngOnInit() {
    if (this.auth.isClinic || this.auth.isAdmin) { this.router.navigate(['/clinici/dashboard']); return; }
    if (!this.auth.isLoggedIn) { this.isLoading = false; return; }
    this.http.get<any[]>(`${API}/appointments`, { headers: this.headers }).subscribe({
      next: (data) => { this.appointments = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  statusLabel(s: string): string {
    const map: any = { pending: 'În așteptare', confirmed: 'Confirmat', cancelled: 'Anulat', completed: 'Finalizat' };
    return map[s] ?? s;
  }

  setFilter(status: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed') {
    this.filterStatus = status;
  }

  countByStatus(status: string): number {
    return this.appointments.filter(a => a.status === status).length;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
