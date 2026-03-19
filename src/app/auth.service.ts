import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'clinic' | 'patient';
  clinicId: string;
  logoUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<AuthUser | null>(null);
  user$ = this.userSubject.asObservable();

  constructor() {
    this.tryRestoreSession();
  }

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  login(email: string, password: string): { success: boolean; error?: string } {
    if (!email || !password) {
      return { success: false, error: 'Completați toate câmpurile.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Adresă de email invalidă.' };
    }
    // Mock auth — replace with HTTP call in production
    const name =
      email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
    const user: AuthUser = {
      id: 'u_' + Date.now(),
      email,
      name,
      role: 'clinic',
      clinicId: '1',
      logoUrl: null,
    };
    this.userSubject.next(user);
    localStorage.setItem('denti_auth', JSON.stringify(user));
    return { success: true };
  }

  register(
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ): { success: boolean; error?: string } {
    if (!name.trim() || !email || !password) {
      return { success: false, error: 'Completați toate câmpurile obligatorii.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Adresă de email invalidă.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Parola trebuie să aibă minim 6 caractere.' };
    }
    if (password !== confirmPassword) {
      return { success: false, error: 'Parolele nu se potrivesc.' };
    }
    const user: AuthUser = {
      id: 'u_' + Date.now(),
      email,
      name: name.trim(),
      role: 'clinic',
      clinicId: 'c_' + Date.now(),
      logoUrl: null,
    };
    this.userSubject.next(user);
    localStorage.setItem('denti_auth', JSON.stringify(user));
    return { success: true };
  }

  logout() {
    this.userSubject.next(null);
    localStorage.removeItem('denti_auth');
  }

  private tryRestoreSession() {
    try {
      const stored = localStorage.getItem('denti_auth');
      if (stored) this.userSubject.next(JSON.parse(stored));
    } catch {
      localStorage.removeItem('denti_auth');
    }
  }
}
