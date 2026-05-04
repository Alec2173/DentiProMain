/** Setează pe true când firma e înregistrată și Stripe e activ */
export const PAID_PLANS_ENABLED = false;

export interface PlanFeature {
  text: string;
  included: boolean;
  tag: string | null;
}

export interface PlanDef {
  id: 'starter' | 'growth' | 'pro';
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  annualTotal: number;
  badge: string | null;
  featured: boolean;
  cta: string;
  features: PlanFeature[];
}

export const PLANS: PlanDef[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Fii găsit de pacienți — fără costuri',
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    annualTotal: 0,
    badge: null,
    featured: false,
    cta: 'Începe gratuit',
    features: [
      { text: 'Apari în căutările pacienților din zona ta', included: true, tag: null },
      { text: 'Profil public vizibil pe hartă', included: true, tag: null },
      { text: 'Listă servicii și prețuri', included: true, tag: null },
      { text: 'Până la 5 fotografii în galerie', included: true, tag: null },
      { text: 'Calendar programări online', included: true, tag: null },
      { text: 'Apari înaintea clinicilor Starter', included: false, tag: null },
      { text: 'Apariție pe homepage DentiPro', included: false, tag: null },
      { text: 'Statistici vizualizări și interes pacienți', included: false, tag: null },
      { text: 'Notificări pacienți în raza 20 km', included: false, tag: null },
      { text: 'Promovare oferte către pacienți activi', included: false, tag: null },
      { text: 'Suport prioritar', included: false, tag: null },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'Primești pacienți constant, fără reclame',
    monthlyPrice: 79,
    annualMonthlyPrice: 66,
    annualTotal: 790,
    badge: 'Cel mai ales',
    featured: true,
    cta: 'Upgrade la Growth',
    features: [
      { text: 'Apari înaintea clinicilor Starter în rezultate', included: true, tag: null },
      { text: 'Badge „Promovat" vizibil în căutări', included: true, tag: null },
      { text: 'Vizibil pe homepage DentiPro', included: true, tag: 'NOU' },
      { text: 'Galerie completă — foto fără limită', included: true, tag: null },
      { text: 'Promovare oferte către pacienți activi (10/lună)', included: true, tag: null },
      { text: 'Statistici vizualizări și interes pacienți', included: true, tag: null },
      { text: 'Calendar programări online', included: true, tag: null },
      { text: 'Raport lunar automat de performanță', included: true, tag: 'NOU' },
      { text: 'Notificări automate pacienți 20 km', included: false, tag: null },
      { text: 'Modul gestionare stocuri', included: false, tag: null },
      { text: 'Suport prioritar 24h', included: false, tag: null },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Domești Top 3 în rezultatele din orașul tău',
    monthlyPrice: 149,
    annualMonthlyPrice: 124,
    annualTotal: 1490,
    badge: null,
    featured: false,
    cta: 'Upgrade la Pro',
    features: [
      { text: 'Ocupi primele poziții în căutările din orașul tău', included: true, tag: null },
      { text: 'Badge „★ VIP" — design premium ce atrage privirile', included: true, tag: null },
      { text: 'Notificări automate pacienți în raza 20 km', included: true, tag: 'SMART' },
      { text: 'Promovare nelimitată oferte pacienți activi', included: true, tag: null },
      { text: 'Apariție prioritară pe homepage DentiPro', included: true, tag: 'NOU' },
      { text: 'Analiză avansată & poziționare față de concurență', included: true, tag: null },
      { text: 'Modul gestionare stocuri + alerte automate', included: true, tag: 'NOU' },
      { text: 'Raport lunar automat de performanță', included: true, tag: null },
      { text: 'Calendar programări online', included: true, tag: null },
      { text: 'Suport prioritar 24h', included: true, tag: null },
      { text: 'Acces API (în curând)', included: true, tag: null },
    ],
  },
];
