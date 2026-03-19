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
  user_id: number | null;
  user_email: string | null;
  user_name: string | null;
  image_count: number;
  service_count: number;
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
  searchQuery = '';
  confirmDeleteId: number | null = null;
  creatingAccounts = false;
  accountsResult: any[] | null = null;

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
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      );
    }
    this.filtered = list;
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

  get pendingCount() { return this.clinics.filter(c => c.status === 'pending').length; }
  get activeCount() { return this.clinics.filter(c => c.status === 'active').length; }
  get suspendedCount() { return this.clinics.filter(c => c.status === 'suspended').length; }

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

  exitToPatient() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  formatDate(d: string) {
    return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
