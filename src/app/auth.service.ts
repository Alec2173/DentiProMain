import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'clinic' | 'patient' | 'admin';
  clinicId: string | null;
  logoUrl: string | null;
}

const API = 'https://www.dentipro.ro/api';
const STORAGE_KEY = 'denti_auth';
const TOKEN_KEY = 'denti_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<AuthUser | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    this.tryRestoreSession();
  }

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  get isClinic(): boolean {
    return this.userSubject.value?.role === 'clinic';
  }

  get isPatient(): boolean {
    return this.userSubject.value?.role === 'patient';
  }

  get isAdmin(): boolean {
    return this.userSubject.value?.role === 'admin';
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // ── LOGIN ────────────────────────────────────────────────
  async login(email: string, password: string): Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }> {
    if (!email || !password) {
      return { success: false, error: 'Completați toate câmpurile.' };
    }
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${API}/auth/login`, { email, password })
      );
      if (res.requiresVerification) {
        return { success: false, requiresVerification: true, email: res.email };
      }
      this.setSession(res.token, res.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.error?.error ?? 'Email sau parolă incorecte.' };
    }
  }

  // ── REGISTER PATIENT ─────────────────────────────────────
  async registerPatient(
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ): Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }> {
    const validation = this.validateRegister(name, email, password, confirmPassword);
    if (!validation.valid) return { success: false, error: validation.error };

    try {
      const res: any = await firstValueFrom(
        this.http.post(`${API}/auth/register`, {
          name: name.trim(),
          email,
          password,
          role: 'patient',
        })
      );
      return { success: true, requiresVerification: true, email: res.email };
    } catch (err: any) {
      return { success: false, error: err?.error?.error ?? 'Eroare la înregistrare.' };
    }
  }

  // ── REGISTER CLINIC ──────────────────────────────────────
  async registerClinic(
    clinicName: string,
    email: string,
    password: string,
    confirmPassword: string,
  ): Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }> {
    const validation = this.validateRegister(clinicName, email, password, confirmPassword);
    if (!validation.valid) return { success: false, error: validation.error };

    try {
      const res: any = await firstValueFrom(
        this.http.post(`${API}/auth/register`, {
          name: clinicName.trim(),
          email,
          password,
          role: 'clinic',
        })
      );
      return { success: true, requiresVerification: true, email: res.email };
    } catch (err: any) {
      return { success: false, error: err?.error?.error ?? 'Eroare la înregistrare.' };
    }
  }

  // ── VERIFY EMAIL ─────────────────────────────────────────
  async verifyEmail(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${API}/auth/verify-email`, { email, code })
      );
      this.setSession(res.token, res.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.error?.error ?? 'Cod incorect sau expirat.' };
    }
  }

  // ── RESEND VERIFICATION ──────────────────────────────────
  async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (!email) return { success: false, error: 'Introduceți emailul.' };
    try {
      await firstValueFrom(this.http.post(`${API}/auth/forgot-password`, { email }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.error?.error ?? 'Eroare. Încearcă din nou.' };
    }
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!email || !code || !newPassword) return { success: false, error: 'Completați toate câmpurile.' };
    try {
      await firstValueFrom(this.http.post(`${API}/auth/reset-password`, { email, code, newPassword }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.error?.error ?? 'Eroare. Încearcă din nou.' };
    }
  }

  async resendVerification(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(
        this.http.post(`${API}/auth/resend-verification`, { email })
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.error?.error ?? 'Eroare la trimiterea codului.' };
    }
  }

  // ── VERIFY SESSION WITH SERVER (chiamat la startup) ──────
  // Verifică în background că tokenul e încă valid server-side.
  // Dacă serverul răspunde cu 401/403, șterge sesiunea.
  verifySession(): void {
    const token = this.getToken();
    if (!token) return;

    this.http
      .get<AuthUser>(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (user) => {
          // Actualizează datele userului (pot fi schimbate de la ultima sesiune)
          this.setSession(token, user);
        },
        error: () => {
          // Token invalid sau expirat pe server → delogare silențioasă
          this.logout();
        },
      });
  }

  // ── REFRESH SESSION FROM SERVER ──────────────────────────
  async refreshCurrentUser(): Promise<void> {
    const token = this.getToken();
    if (!token) return;
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      this.setSession(token, res);
    } catch {}
  }

  // ── LOGOUT ───────────────────────────────────────────────
  logout() {
    this.userSubject.next(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  // ── PRIVATE ──────────────────────────────────────────────
  private validateRegister(name: string, email: string, password: string, confirm: string) {
    if (!name.trim() || !email || !password) {
      return { valid: false, error: 'Completați toate câmpurile.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { valid: false, error: 'Adresă de email invalidă.' };
    }
    if (password.length < 6) {
      return { valid: false, error: 'Parola trebuie să aibă minim 6 caractere.' };
    }
    if (password !== confirm) {
      return { valid: false, error: 'Parolele nu se potrivesc.' };
    }
    return { valid: true };
  }

  private setSession(token: string, user: AuthUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private tryRestoreSession() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!token || !stored) {
        this.clearStorage();
        return;
      }

      // Verifică expirarea tokenului client-side (fără request la server)
      if (this.isTokenExpired(token)) {
        this.clearStorage();
        return;
      }

      this.userSubject.next(JSON.parse(stored));
    } catch {
      this.clearStorage();
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return false; // token fără expirare (legacy) — considerăm valid
      return payload.exp * 1000 < Date.now();
    } catch {
      return true; // token malformat → tratăm ca expirat
    }
  }

  private clearStorage() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}
