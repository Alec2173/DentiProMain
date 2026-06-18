import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { AuthService } from '../auth.service';

const API = 'https://www.dentipro.ro/api';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, LowerCasePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  // Stats
  appointmentsCount = 0;
  favoritesCount = 0;
  statsLoading = true;

  // Name edit
  editingName = false;
  nameValue = '';
  nameSaving = false;
  nameError = '';
  nameSuccess = false;

  // Password change
  editingPassword = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordSaving = false;
  passwordError = '';
  passwordSuccess = false;
  showCurrentPw = false;
  showNewPw = false;

  constructor(private http: HttpClient, public auth: AuthService, private router: Router) {}

  get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn) { this.router.navigate(['/']); return; }
    if (this.auth.isClinic) { this.router.navigate(['/clinici/dashboard']); return; }
    this.loadStats();
    this.loadPoints();
    this.loadPrefs();
  }

  loadStats() {
    this.http.get<any[]>(`${API}/appointments`, { headers: this.headers }).subscribe({
      next: (data) => { this.appointmentsCount = data.length; },
      error: () => {}
    });
    this.http.get<any[]>(`${API}/favorites`, { headers: this.headers }).subscribe({
      next: (data) => { this.favoritesCount = data.length; this.statsLoading = false; },
      error: () => { this.statsLoading = false; }
    });
  }

  getInitials(): string {
    const name = this.auth.currentUser?.name ?? '';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  }

  openNameEdit() {
    this.nameValue = this.auth.currentUser?.name ?? '';
    this.nameError = '';
    this.nameSuccess = false;
    this.editingName = true;
  }

  saveName() {
    if (!this.nameValue.trim() || this.nameValue.trim().length < 2) {
      this.nameError = 'Numele trebuie să aibă minim 2 caractere.';
      return;
    }
    this.nameSaving = true;
    this.nameError = '';
    this.http.patch<any>(`${API}/users/me`, { name: this.nameValue.trim() }, { headers: this.headers }).subscribe({
      next: (user) => {
        this.auth.refreshCurrentUser();
        this.nameSuccess = true;
        this.nameSaving = false;
        setTimeout(() => { this.editingName = false; this.nameSuccess = false; }, 1200);
      },
      error: (err) => {
        this.nameError = err.error?.error || 'Eroare la salvare.';
        this.nameSaving = false;
      }
    });
  }

  openPasswordEdit() {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
    this.passwordSuccess = false;
    this.editingPassword = true;
  }

  savePassword() {
    if (!this.currentPassword) { this.passwordError = 'Introdu parola curentă.'; return; }
    if (this.newPassword.length < 6) { this.passwordError = 'Parola nouă trebuie să aibă minim 6 caractere.'; return; }
    if (this.newPassword !== this.confirmPassword) { this.passwordError = 'Parolele nu coincid.'; return; }
    this.passwordSaving = true;
    this.passwordError = '';
    this.http.patch(`${API}/users/me`, { currentPassword: this.currentPassword, newPassword: this.newPassword }, { headers: this.headers }).subscribe({
      next: () => {
        this.passwordSuccess = true;
        this.passwordSaving = false;
        setTimeout(() => { this.editingPassword = false; this.passwordSuccess = false; }, 1500);
      },
      error: (err) => {
        this.passwordError = err.error?.error || 'Eroare la schimbarea parolei.';
        this.passwordSaving = false;
      }
    });
  }

  memberSince(): string {
    const d = this.auth.currentUser?.created_at;
    if (!d) return '2026';
    return new Date(d).getFullYear().toString();
  }

  // ── PREFERINȚE NOTIFICĂRI ─────────────────────────────────
  prefs: any = null;
  prefsSaving = false;

  loadPrefs() {
    this.http.get<any>(`${API}/notif-prefs`, { headers: this.headers }).subscribe({
      next: (p) => { this.prefs = p; },
      error: () => {},
    });
  }

  savePrefs() {
    this.prefsSaving = true;
    this.http.patch(`${API}/notif-prefs`, this.prefs, { headers: this.headers }).subscribe({
      next: () => { this.prefsSaving = false; },
      error: () => { this.prefsSaving = false; },
    });
  }

  // ── REWARD POINTS ─────────────────────────────────────────
  points: { current: number; lifetime: number; level: any; history: any[] } | null = null;
  pointsLoading = true;

  loadPoints() {
    this.pointsLoading = true;
    this.http.get<any>(`${API}/patients/me/points`, { headers: this.headers }).subscribe({
      next: (data) => { this.points = data; this.pointsLoading = false; },
      error: () => { this.pointsLoading = false; },
    });
  }

  get levelProgress(): number {
    if (!this.points) return 0;
    const { current, level } = this.points;
    if (!level.nextAt) return 100;
    const prev = level.name === 'Silver' ? 100 : 0;
    return Math.min(100, Math.round(((current - prev) / (level.nextAt - prev)) * 100));
  }

  pointsIcon(reason: string): string {
    const icons: Record<string, string> = {
      appointment_completed : 'fa-calendar-check',
      review_published      : 'fa-star',
      profile_complete      : 'fa-user-check',
      referral              : 'fa-user-plus',
      admin_manual          : 'fa-shield-alt',
    };
    return icons[reason] ?? 'fa-gift';
  }
}
