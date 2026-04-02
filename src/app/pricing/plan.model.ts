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
    tagline: 'Vizibilitate de bază, gratuit permanent',
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    annualTotal: 0,
    badge: null,
    featured: false,
    cta: 'Începe gratuit',
    features: [
      { text: 'Profil public pe platformă', included: true,  tag: null },
      { text: 'Marker pe harta interactivă', included: true,  tag: null },
      { text: 'Până la 5 imagini în galerie', included: true,  tag: null },
      { text: 'Listă servicii de bază', included: true,  tag: null },
      { text: 'Apariție în rezultatele search', included: true,  tag: null },
      { text: 'Feed pacienți & oferte', included: false, tag: null },
      { text: 'Apariție pe homepage', included: false, tag: null },
      { text: 'Analytics & rapoarte', included: false, tag: null },
      { text: 'Notificări pacienți 20km', included: false, tag: null },
      { text: 'Modul stocuri & alerte', included: false, tag: null },
      { text: 'Suport prioritar', included: false, tag: null },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'Pentru clinici care vor să crească',
    monthlyPrice: 49,
    annualMonthlyPrice: 41,
    annualTotal: 490,
    badge: 'Cel mai ales',
    featured: true,
    cta: 'Activează Growth',
    features: [
      { text: 'Profil public pe platformă', included: true,  tag: null },
      { text: 'Galerie nelimitată (foto + video)', included: true,  tag: null },
      { text: 'Prioritate în search față de Starter', included: true,  tag: null },
      { text: 'Apariție pe homepage', included: true,  tag: 'NOU' },
      { text: 'Feed pacienți — 10 oferte/lună', included: true,  tag: null },
      { text: 'Analytics de bază', included: true,  tag: null },
      { text: 'Notificări pacienți 20km', included: false, tag: null },
      { text: 'Banderolă Promovat', included: false, tag: null },
      { text: 'Modul stocuri & alerte', included: false, tag: null },
      { text: 'Analytics avansat & benchmark', included: false, tag: null },
      { text: 'Suport prioritar 24h', included: false, tag: null },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Vizibilitate maximă, fără compromisuri',
    monthlyPrice: 99,
    annualMonthlyPrice: 83,
    annualTotal: 990,
    badge: null,
    featured: false,
    cta: 'Activează Pro',
    features: [
      { text: 'Top 3 poziții în search per oraș', included: true,  tag: null },
      { text: 'Banderolă Promovat vizibilă', included: true,  tag: null },
      { text: 'Galerie nelimitată (foto + video)', included: true,  tag: null },
      { text: 'Apariție pe homepage (prioritate)', included: true,  tag: 'NOU' },
      { text: 'Oferte nelimitate în feed pacienți', included: true,  tag: null },
      { text: 'Notificări pacienți în raza 20km', included: true,  tag: 'SMART' },
      { text: 'Modul stocuri & alerte expirare', included: true,  tag: 'NOU' },
      { text: 'Analytics avansat & benchmark', included: true,  tag: null },
      { text: 'Suport prioritar 24h', included: true,  tag: null },
      { text: 'Toate beneficiile Growth incluse', included: true,  tag: null },
      { text: 'API acces (coming soon)', included: true,  tag: null },
    ],
  },
];
