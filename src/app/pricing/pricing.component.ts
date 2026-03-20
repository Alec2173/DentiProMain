import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../seo.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css',
})
export class PricingComponent implements OnInit {
  private seo = inject(SeoService);

  billingAnnual = false;

  ngOnInit() {
    this.seo.set({
      title: 'Prețuri și pachete pentru clinici dentare | DentiPro',
      description: 'Alege planul potrivit pentru clinica ta. Starter gratuit, Pro și Enterprise cu funcții avansate: vizibilitate crescută, programări online, statistici pacienți.',
      canonical: 'https://dentipro.ro/clinici/pricing',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: this.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      },
    });
  }

  readonly plans = [
    {
      id: 'starter',
      name: 'Starter',
      tagline: 'Pentru clinici care vor să fie descoperite',
      monthlyPrice: 0,
      annualMonthlyPrice: 0,
      annualTotal: 0,
      badge: null,
      featured: false,
      cta: 'Începe gratuit',
      ctaLink: '/Inscriere',
      features: [
        { text: 'Profil public pe platformă', included: true, tag: null },
        { text: 'Marker pe harta interactivă', included: true, tag: null },
        { text: 'Până la 5 imagini în galerie', included: true, tag: null },
        { text: 'Listă servicii de bază', included: true, tag: null },
        { text: 'Apariție în rezultatele search', included: true, tag: null },
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
      ctaLink: '/Inscriere',
      features: [
        { text: 'Profil public pe platformă', included: true, tag: null },
        { text: 'Galerie nelimitată (foto + video)', included: true, tag: null },
        { text: 'Prioritate în search față de Starter', included: true, tag: null },
        { text: 'Apariție pe homepage', included: true, tag: 'NOU' },
        { text: 'Feed pacienți — 10 oferte/lună', included: true, tag: null },
        { text: 'Analytics de bază', included: true, tag: null },
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
      tagline: 'Pentru clinici care vor să domine',
      monthlyPrice: 99,
      annualMonthlyPrice: 83,
      annualTotal: 990,
      badge: null,
      featured: false,
      cta: 'Activează Pro',
      ctaLink: '/Inscriere',
      features: [
        { text: 'Top 3 poziții în search per oraș', included: true, tag: null },
        { text: 'Banderolă Promovat vizibilă', included: true, tag: null },
        { text: 'Galerie nelimitată (foto + video)', included: true, tag: null },
        { text: 'Apariție pe homepage (prioritate)', included: true, tag: 'NOU' },
        { text: 'Oferte nelimitate în feed pacienți', included: true, tag: null },
        { text: 'Notificări pacienți în raza 20km', included: true, tag: 'SMART' },
        { text: 'Modul stocuri & alerte expirare', included: true, tag: 'NOU' },
        { text: 'Analytics avansat & benchmark', included: true, tag: null },
        { text: 'Suport prioritar 24h', included: true, tag: null },
        { text: 'Toate beneficiile Growth incluse', included: true, tag: null },
        { text: 'API acces (coming soon)', included: true, tag: null },
      ],
    },
  ];

  readonly faqs = [
    {
      q: 'Pot schimba planul oricând?',
      a: 'Da, poți face upgrade sau downgrade din dashboard-ul tău în orice moment. Schimbările intră în vigoare imediat.',
    },
    {
      q: 'Ce se întâmplă la planul anual dacă doresc să anulez?',
      a: 'Poți anula oricând. Accesul rămâne activ până la finalul perioadei plătite.',
    },
    {
      q: 'Există o perioadă de probă?',
      a: 'Planul Starter este permanent gratuit. Pentru Growth și Pro oferim o perioadă de probă de 14 zile fără card bancar.',
    },
    {
      q: 'Cum funcționează notificările pacienților (20km)?',
      a: 'Pacienții care au optat explicit pentru notificări GDPR-compliant primesc alerte când o clinică Pro din raza de 20km publică o ofertă.',
    },
  ];

  openFaq: number | null = null;

  toggleBilling() {
    this.billingAnnual = !this.billingAnnual;
  }

  getDisplayPrice(plan: any): number {
    return this.billingAnnual ? plan.annualMonthlyPrice : plan.monthlyPrice;
  }

  toggleFaq(index: number) {
    this.openFaq = this.openFaq === index ? null : index;
  }
}
