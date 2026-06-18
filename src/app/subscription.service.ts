import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

const API = '/api';

export type SubscriptionPlan = 'starter' | 'growth' | 'pro';
export type SubscriptionStatus = 'active' | 'inactive' | 'trialing' | 'trial' | 'past_due' | 'canceled';

export interface ClinicSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  subscriptionId: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  hasStripe: boolean;
}

const GROWTH_OFFER_LIMIT = 10;

const DEFAULT_SUB: ClinicSubscription = {
  plan: 'starter',
  status: 'active',
  subscriptionId: null,
  currentPeriodEnd: null,
  trialEndsAt: null,
  hasStripe: false,
};

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private sub$ = new BehaviorSubject<ClinicSubscription>(DEFAULT_SUB);
  private loaded = false;

  /** Starea curentă ca Observable — componentele pot subscribe */
  readonly subscription$ = this.sub$.asObservable();

  get snapshot(): ClinicSubscription {
    return this.sub$.value;
  }

  get plan(): SubscriptionPlan {
    return this.sub$.value.plan;
  }

  get isPro(): boolean {
    return this.sub$.value.plan === 'pro';
  }

  get isGrowthOrPro(): boolean {
    const p = this.sub$.value.plan;
    return p === 'growth' || p === 'pro';
  }

  get canSendOffer(): boolean {
    const p = this.sub$.value.plan;
    if (p === 'starter') return false;
    if (p === 'pro') return true;
    return this.monthlyOffersUsed < GROWTH_OFFER_LIMIT;
  }

  get offersRemaining(): number {
    if (this.sub$.value.plan === 'pro') return Infinity;
    if (this.sub$.value.plan === 'starter') return 0;
    return Math.max(0, GROWTH_OFFER_LIMIT - this.monthlyOffersUsed);
  }

  private get offerCountKey(): string {
    const month = new Date().toISOString().slice(0, 7);
    return `dp_offc_${this.auth.currentUser?.clinicId}_${month}`;
  }

  get monthlyOffersUsed(): number {
    try { return parseInt(localStorage.getItem(this.offerCountKey) ?? '0', 10); } catch { return 0; }
  }

  incrementOfferCount(): void {
    if (this.sub$.value.plan === 'growth') {
      localStorage.setItem(this.offerCountKey, String(this.monthlyOffersUsed + 1));
    }
  }

  /**
   * Încarcă abonamentul de la backend.
   * Apelează o singură dată pe sesiune; apeluri ulterioare returnează cache-ul.
   */
  load(force = false): Observable<ClinicSubscription> {
    if (this.loaded && !force) {
      return of(this.sub$.value);
    }

    const token = this.auth.getToken();
    if (!token) {
      return of(DEFAULT_SUB);
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.get<any>(`${API}/stripe/subscription`, { headers }).pipe(
      map(data => ({
        plan: (data.plan ?? 'starter') as SubscriptionPlan,
        status: (data.status ?? 'active') as SubscriptionStatus,
        subscriptionId: data.subscriptionId ?? null,
        currentPeriodEnd: data.currentPeriodEnd ?? null,
        trialEndsAt: data.trialEndsAt ?? null,
        hasStripe: data.hasStripe ?? false,
      })),
      tap(sub => {
        this.sub$.next(sub);
        this.loaded = true;
      }),
      catchError(() => {
        this.loaded = true;
        return of(this.sub$.value);
      }),
    );
  }

  /** Resetează cache-ul (ex. după upgrade plan) */
  reset(): void {
    this.loaded = false;
    this.sub$.next(DEFAULT_SUB);
  }
}
