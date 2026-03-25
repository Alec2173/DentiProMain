import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { SeoService } from '../seo.service';

interface ServicePrice {
  label: string;
  id: string;
  min: number;
  avg: number;
  max: number;
  unit: string;
}

@Component({
  selector: 'app-preturi',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './preturi.component.html',
  styleUrl: './preturi.component.css',
})
export class PreturiComponent implements OnInit {
  private seo = inject(SeoService);

  activeCategory: 'toate' | 'estetica' | 'restaurativa' | 'chirurgie' | 'preventie' = 'toate';

  readonly categories = [
    { id: 'toate', label: 'Toate' },
    { id: 'estetica', label: 'Estetică' },
    { id: 'restaurativa', label: 'Restaurativă' },
    { id: 'chirurgie', label: 'Chirurgie' },
    { id: 'preventie', label: 'Prevenție' },
  ] as const;

  readonly prices: (ServicePrice & { category: string })[] = [
    // Prevenție
    { id: 'detartraj',  label: 'Detartraj',                     min: 80,   avg: 120,  max: 250,  unit: 'ședință', category: 'preventie' },
    { id: 'profilaxie', label: 'Profilaxie / Periaj profesional', min: 100,  avg: 150,  max: 300,  unit: 'ședință', category: 'preventie' },
    { id: 'radiologie', label: 'Radiografie dentară (RX)',       min: 30,   avg: 60,   max: 120,  unit: 'bucată',  category: 'preventie' },
    { id: 'digital',    label: 'Consultație inițială',           min: 0,    avg: 60,   max: 150,  unit: 'ședință', category: 'preventie' },
    // Restaurativă
    { id: 'obturatii',  label: 'Obturaţie (plombă)',             min: 80,   avg: 180,  max: 450,  unit: 'dinte',   category: 'restaurativa' },
    { id: 'endodontie', label: 'Tratament de canal (endodonție)',min: 250,  avg: 450,  max: 900,  unit: 'dinte',   category: 'restaurativa' },
    { id: 'coronite',   label: 'Coroană dentară (porțelan)',     min: 400,  avg: 700,  max: 1500, unit: 'dinte',   category: 'restaurativa' },
    { id: 'protetica',  label: 'Proteză dentară mobilă',         min: 500,  avg: 1200, max: 3000, unit: 'arcadă',  category: 'restaurativa' },
    { id: 'proteze',    label: 'Proteză acrilică totală',        min: 800,  avg: 1500, max: 4000, unit: 'arcadă',  category: 'restaurativa' },
    { id: 'dantura',    label: 'Reconstrucție completă (zâmbet)', min: 3000, avg: 8000, max: 25000, unit: 'caz',   category: 'restaurativa' },
    // Estetică
    { id: 'albire',     label: 'Albire dentară (cabinet)',        min: 300,  avg: 600,  max: 1200, unit: 'ședință', category: 'estetica' },
    { id: 'fatete',     label: 'Fațete dentare (compozit)',       min: 300,  avg: 600,  max: 1000, unit: 'dinte',   category: 'estetica' },
    { id: 'estetica',   label: 'Fațete ceramice (porțelan)',      min: 800,  avg: 1200, max: 2500, unit: 'dinte',   category: 'estetica' },
    { id: 'laser',      label: 'Tratament cu laser',               min: 200,  avg: 400,  max: 900,  unit: 'ședință', category: 'estetica' },
    // Chirurgie
    { id: 'chirurgie',  label: 'Extracție simplă',                min: 80,   avg: 150,  max: 400,  unit: 'dinte',   category: 'chirurgie' },
    { id: 'implanturi', label: 'Implant dentar (titanium)',        min: 1200, avg: 2200, max: 5000, unit: 'implant', category: 'chirurgie' },
    { id: 'grefe',      label: 'Grefă osoasă',                    min: 800,  avg: 1500, max: 4000, unit: 'procedură', category: 'chirurgie' },
    { id: 'sinuslift',  label: 'Sinus lift',                       min: 1500, avg: 3000, max: 7000, unit: 'procedură', category: 'chirurgie' },
    // Ortodonție
    { id: 'aparate',    label: 'Aparat dentar fix (metalic)',      min: 1200, avg: 2500, max: 5000, unit: 'arcadă',  category: 'estetica' },
    { id: 'ortodontie', label: 'Aparat transparent (alinere)',     min: 2500, avg: 4500, max: 10000, unit: 'tratament', category: 'estetica' },
  ];

  get filteredPrices() {
    if (this.activeCategory === 'toate') return this.prices;
    return this.prices.filter(p => p.category === this.activeCategory);
  }

  setCategory(cat: any) {
    this.activeCategory = cat;
  }

  ngOnInit() {
    this.seo.set({
      title: 'Prețuri stomatologie 2025 — Costuri servicii dentare în România | DentiPro',
      description: 'Află cât costă tratamentele stomatologice în România în 2025: implanturi, aparat dentar, albire, tratament de canal. Prețuri minime, medii și maxime actualizate.',
      canonical: 'https://dentipro.ro/preturi',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Prețuri stomatologie 2025 România',
        description: 'Calculator prețuri tratamente stomatologice România 2025',
        url: 'https://dentipro.ro/preturi',
      },
    });
  }
}
