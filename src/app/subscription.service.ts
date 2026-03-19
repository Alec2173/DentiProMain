import { Injectable } from '@angular/core';

export type SubscriptionPlan = 'starter' | 'growth' | 'pro';
export type SubscriptionStatus = 'active' | 'inactive' | 'trial';

export interface ClinicSubscription {
  clinicId: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'annual';
  expiry: Date | null;
  offersUsedThisMonth: number;
}

// Mock data — va fi înlocuit cu API call
const MOCK_SUBSCRIPTIONS: ClinicSubscription[] = [
  { clinicId: 1, plan: 'pro',     status: 'active', billingCycle: 'annual',  expiry: new Date('2026-12-31'), offersUsedThisMonth: 0 },
  { clinicId: 2, plan: 'growth',  status: 'active', billingCycle: 'monthly', expiry: new Date('2026-04-18'), offersUsedThisMonth: 7 },
  { clinicId: 3, plan: 'starter', status: 'active', billingCycle: 'monthly', expiry: null,                   offersUsedThisMonth: 0 },
];

const GROWTH_OFFER_LIMIT = 10;

@Injectable({ providedIn: 'root' })
export class SubscriptionService {

  private getSubscription(clinicId: number): ClinicSubscription {
    return (
      MOCK_SUBSCRIPTIONS.find((s) => s.clinicId === clinicId) ?? {
        clinicId,
        plan: 'starter',
        status: 'active',
        billingCycle: 'monthly',
        expiry: null,
        offersUsedThisMonth: 0,
      }
    );
  }

  getClinicPlan(clinicId: number): SubscriptionPlan {
    return this.getSubscription(clinicId).plan;
  }

  isPro(clinicId: number): boolean {
    return this.getClinicPlan(clinicId) === 'pro';
  }

  isGrowthOrPro(clinicId: number): boolean {
    const plan = this.getClinicPlan(clinicId);
    return plan === 'growth' || plan === 'pro';
  }

  canSendOffer(clinicId: number): boolean {
    const sub = this.getSubscription(clinicId);
    if (sub.plan === 'starter') return false;
    if (sub.plan === 'pro') return true;
    return sub.offersUsedThisMonth < GROWTH_OFFER_LIMIT;
  }

  getRemainingOffers(clinicId: number): number {
    const sub = this.getSubscription(clinicId);
    if (sub.plan === 'pro') return Infinity;
    if (sub.plan === 'starter') return 0;
    return Math.max(0, GROWTH_OFFER_LIMIT - sub.offersUsedThisMonth);
  }

  getOffersUsed(clinicId: number): number {
    return this.getSubscription(clinicId).offersUsedThisMonth;
  }
}
