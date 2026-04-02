import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SeoService } from '../seo.service';
import { PlanCardComponent } from './plan-card/plan-card.component';
import { PLANS } from './plan.model';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [RouterLink, PlanCardComponent],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css',
})
export class PricingComponent implements OnInit {
  private seo   = inject(SeoService);
  private route = inject(ActivatedRoute);

  billingAnnual = false;

  /** Planurile sunt definite o singură dată în plan.model.ts */
  readonly plans = PLANS;

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
    {
      q: 'Cum plătesc? Ce metode de plată acceptați?',
      a: 'Plata se face prin Stripe — carduri Visa, Mastercard, American Express. Factura este generată automat lunar sau anual.',
    },
    {
      q: 'Ce se întâmplă după plată?',
      a: 'Imediat după confirmarea plății, planul tău este activat automat și profilul clinicii beneficiază de toate funcțiile incluse.',
    },
  ];

  openFaq: number | null = null;

  ngOnInit() {
    this.seo.set({
      title: 'Prețuri și pachete pentru clinici dentare | DentiPro',
      description: 'Alege planul potrivit pentru clinica ta. Starter gratuit, Growth 49€/lună, Pro 99€/lună. Funcții avansate: vizibilitate crescută, programări online, statistici pacienți.',
      canonical: 'https://dentipro.ro/clinici/pricing',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: this.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      },
    });
  }

  toggleBilling() { this.billingAnnual = !this.billingAnnual; }

  toggleFaq(index: number) {
    this.openFaq = this.openFaq === index ? null : index;
  }
}
