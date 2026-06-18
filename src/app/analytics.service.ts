import { Injectable } from '@angular/core';
import posthog from 'posthog-js';

const POSTHOG_KEY = 'phc_xm9JpjC7HTUBqMvhMwNTYidDmFy9zdkU2M47A8qy9pnm';
const POSTHOG_HOST = 'https://eu.i.posthog.com';
const UTM_STORAGE_KEY = 'dp_attribution';

interface Attribution {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_page: string | null;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private initialized = false;
  private attribution: Attribution = { utm_source: null, utm_medium: null, utm_campaign: null, referrer: null, landing_page: null };

  init(): void {
    if (this.initialized || !POSTHOG_KEY.startsWith('phc_')) return;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: false,
      persistence: 'localStorage+cookie',
    });
    this.captureAttribution();
    this.initialized = true;
  }

  // ── ATTRIBUTION (UTM + referrer, salvat o singură dată per sesiune) ─────
  private captureAttribution(): void {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      try { this.attribution = JSON.parse(stored); return; } catch {}
    }
    const p = new URLSearchParams(window.location.search);
    this.attribution = {
      utm_source:   p.get('utm_source'),
      utm_medium:   p.get('utm_medium'),
      utm_campaign: p.get('utm_campaign'),
      referrer:     document.referrer || null,
      landing_page: window.location.pathname,
    };
    // Salvează numai dacă există cel puțin o informație de attribution
    if (Object.values(this.attribution).some(v => v !== null)) {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(this.attribution));
    }
    // Înregistrează ca super properties — se atașează la TOATE evenimentele viitoare
    posthog.register({
      ...this.attribution,
    });
  }

  private attr(): Attribution { return this.attribution; }

  // ── IDENTITY ────────────────────────────────────────────────────────────
  identify(userId: string, user: {
    role: 'clinic' | 'patient' | 'admin';
    name?: string;
    email?: string;
    plan?: string;
    created_at?: string;
  }): void {
    const createdAt = user.created_at ? new Date(user.created_at) : null;
    const daysSinceReg = createdAt
      ? Math.floor((Date.now() - createdAt.getTime()) / 86_400_000)
      : null;
    const isNewUser = daysSinceReg !== null && daysSinceReg < 3;

    posthog.identify(userId, {
      email: user.email,
      name: user.name,
      user_type: user.role,
      plan: user.plan ?? (user.role === 'clinic' ? 'starter' : null),
      is_new_user: isNewUser,
      registration_date: user.created_at ?? null,
      days_since_registration: daysSinceReg,
      ...this.attr(),
    });

    // Setează user_type ca super property pentru toate evenimentele sesiunii
    posthog.register({ user_type: user.role });
  }

  reset(): void {
    posthog.reset();
    posthog.unregister('user_type');
  }

  // ── PAGE VIEW ────────────────────────────────────────────────────────────
  page(url: string): void {
    posthog.capture('page_viewed', { url, ...this.attr() });
  }

  // ── PATIENT: SEARCH ──────────────────────────────────────────────────────
  searchPerformed(city: string, service: string, maxPrice?: number | null): void {
    posthog.capture('search_performed', {
      city: city || null,
      service: service || null,
      max_price: maxPrice ?? null,
    });
  }

  // ── PATIENT: CLINIC DISCOVERY ────────────────────────────────────────────
  clinicCardClicked(clinicId: number, clinicName: string, source: 'cards' | 'map' | 'search' | 'similar'): void {
    posthog.capture('clinic_card_clicked', { clinic_id: clinicId, clinic_name: clinicName, source });
  }

  clinicViewed(clinicId: number, clinicName: string, city: string): void {
    posthog.capture('clinic_viewed', { clinic_id: clinicId, clinic_name: clinicName, city });
  }

  // ── PATIENT: APPOINTMENT FUNNEL ──────────────────────────────────────────
  appointmentModalOpened(clinicId: number, clinicName: string): void {
    posthog.capture('appointment_modal_opened', { clinic_id: clinicId, clinic_name: clinicName });
  }

  appointmentCreated(clinicId: number, clinicName: string, serviceId?: string | null): void {
    posthog.capture('appointment_created', { clinic_id: clinicId, clinic_name: clinicName, service_id: serviceId ?? null });
  }

  appointmentFailed(clinicId: number, reason: string): void {
    posthog.capture('appointment_failed', { clinic_id: clinicId, reason });
  }

  // ── PATIENT: MESSAGE FUNNEL ──────────────────────────────────────────────
  messageModalOpened(clinicId: number, clinicName: string): void {
    posthog.capture('message_modal_opened', { clinic_id: clinicId, clinic_name: clinicName });
  }

  messageSent(clinicId: number): void {
    posthog.capture('message_sent', { clinic_id: clinicId });
  }

  messageFailed(clinicId: number, reason: string): void {
    posthog.capture('message_failed', { clinic_id: clinicId, reason });
  }

  // ── PATIENT: OTHER ───────────────────────────────────────────────────────
  favoriteToggled(clinicId: number, action: 'added' | 'removed'): void {
    posthog.capture('favorite_toggled', { clinic_id: clinicId, action });
  }

  feedPostCreated(city: string, service?: string | null): void {
    posthog.capture('feed_post_created', { city, service: service ?? null });
  }

  reviewSubmitted(clinicId: number, rating: number): void {
    posthog.capture('review_submitted', { clinic_id: clinicId, rating });
  }

  // ── CLINIC SIGNUP FUNNEL ──────────────────────────────────────────────────
  signupStarted(source?: string | null): void {
    posthog.capture('clinic_signup_started', { source: source ?? null, ...this.attr() });
  }

  signupStepCompleted(step: number, stepLabel: string): void {
    posthog.capture('clinic_signup_step_completed', { step, step_label: stepLabel });
  }

  paymentStarted(plan: string, billing: string): void {
    posthog.capture('clinic_payment_started', { plan, billing });
  }

  paymentCanceled(plan: string): void {
    posthog.capture('clinic_payment_canceled', { plan });
  }

  signupCompleted(plan: string): void {
    posthog.capture('clinic_signup_completed', { plan });
  }

  // ── GENERIC ───────────────────────────────────────────────────────────────
  track(event: string, props?: Record<string, any>): void {
    posthog.capture(event, props);
  }
}
