import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

const API = 'https://www.dentipro.ro/api';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private favoritedIds = new Set<number>();
  private favoritedIds$ = new BehaviorSubject<Set<number>>(new Set());

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  isFavorited(clinicId: number): boolean {
    return this.favoritedIds.has(clinicId);
  }

  favorited$(): Observable<Set<number>> {
    return this.favoritedIds$.asObservable();
  }

  toggle(clinicId: number): void {
    if (!this.auth.isLoggedIn) return;
    if (this.isFavorited(clinicId)) {
      this.favoritedIds.delete(clinicId);
      this.favoritedIds$.next(new Set(this.favoritedIds));
      this.http.delete(`${API}/favorites/${clinicId}`, { headers: this.headers() }).subscribe();
    } else {
      this.favoritedIds.add(clinicId);
      this.favoritedIds$.next(new Set(this.favoritedIds));
      this.http.post(`${API}/favorites/${clinicId}`, {}, { headers: this.headers() }).subscribe();
    }
  }

  loadAll(): void {
    if (!this.auth.isLoggedIn) return;
    this.http.get<any[]>(`${API}/favorites`, { headers: this.headers() }).subscribe({
      next: (items) => {
        this.favoritedIds = new Set(items.map(i => i.id));
        this.favoritedIds$.next(new Set(this.favoritedIds));
      }
    });
  }

  getFavorites(): Observable<any[]> {
    return this.http.get<any[]>(`${API}/favorites`, { headers: this.headers() });
  }
}
