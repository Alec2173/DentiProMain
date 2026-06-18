import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../seo.service';

interface ServicePrice {
  label: string;
  id: string;
  min: number;
  avg: number;
  max: number;
  unit: string;
  category: string;
}

@Component({
  selector: 'app-preturi',
  standalone: true,
  imports: [RouterLink, DecimalPipe, FormsModule],
  templateUrl: './preturi.component.html',
  styleUrl: './preturi.component.css',
})
export class PreturiComponent implements OnInit {
  private seo = inject(SeoService);

  searchQuery = '';
  activeCategory: string = 'toate';
  selectedCity = '';
  selectedMaxPrice: number | null = null;

  readonly categories = [
    { id: 'toate',       label: 'Toate',          icon: 'grid_view' },
    { id: 'preventie',   label: 'Prevenție',       icon: 'shield' },
    { id: 'restaurativa',label: 'Restaurativă',    icon: 'build' },
    { id: 'estetica',    label: 'Estetică',         icon: 'auto_fix_high' },
    { id: 'chirurgie',   label: 'Chirurgie',        icon: 'medical_services' },
  ] as const;

  readonly cities = [
    'București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța',
    'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Oradea',
    'Sibiu', 'Bacău', 'Arad', 'Pitești', 'Baia Mare',
    'Buzău', 'Botoșani', 'Satu Mare', 'Râmnicu Vâlcea', 'Suceava',
  ];

  readonly priceRanges = [
    { label: 'Orice preț',    value: null },
    { label: 'Sub 200 lei',   value: 200 },
    { label: 'Sub 500 lei',   value: 500 },
    { label: 'Sub 1.000 lei', value: 1000 },
    { label: 'Sub 2.500 lei', value: 2500 },
    { label: 'Sub 5.000 lei', value: 5000 },
  ];

  readonly prices: ServicePrice[] = [
    // Prevenție
    { id: 'detartraj',  label: 'Detartraj',                       min: 80,   avg: 120,  max: 250,  unit: 'ședință',   category: 'preventie' },
    { id: 'profilaxie', label: 'Profilaxie / Periaj profesional',  min: 100,  avg: 150,  max: 300,  unit: 'ședință',   category: 'preventie' },
    { id: 'radiologie', label: 'Radiografie dentară (RX)',         min: 30,   avg: 60,   max: 120,  unit: 'bucată',    category: 'preventie' },
    { id: 'consultatie',label: 'Consultație inițială',             min: 0,    avg: 60,   max: 150,  unit: 'ședință',   category: 'preventie' },
    // Restaurativă
    { id: 'obturatii',  label: 'Obturaţie (plombă)',               min: 80,   avg: 180,  max: 450,  unit: 'dinte',     category: 'restaurativa' },
    { id: 'endodontie', label: 'Tratament de canal (endodonție)',  min: 250,  avg: 450,  max: 900,  unit: 'dinte',     category: 'restaurativa' },
    { id: 'coronite',   label: 'Coroană dentară (porțelan)',       min: 400,  avg: 700,  max: 1500, unit: 'dinte',     category: 'restaurativa' },
    { id: 'protetica',  label: 'Proteză dentară mobilă',           min: 500,  avg: 1200, max: 3000, unit: 'arcadă',    category: 'restaurativa' },
    { id: 'proteze',    label: 'Proteză acrilică totală',          min: 800,  avg: 1500, max: 4000, unit: 'arcadă',    category: 'restaurativa' },
    { id: 'dantura',    label: 'Reconstrucție completă (zâmbet)',  min: 3000, avg: 8000, max: 25000,unit: 'caz',       category: 'restaurativa' },
    // Estetică
    { id: 'albire',     label: 'Albire dentară (cabinet)',         min: 300,  avg: 600,  max: 1200, unit: 'ședință',   category: 'estetica' },
    { id: 'fatete',     label: 'Fațete dentare (compozit)',        min: 300,  avg: 600,  max: 1000, unit: 'dinte',     category: 'estetica' },
    { id: 'estetica',   label: 'Fațete ceramice (porțelan)',       min: 800,  avg: 1200, max: 2500, unit: 'dinte',     category: 'estetica' },
    { id: 'laser',      label: 'Tratament cu laser',               min: 200,  avg: 400,  max: 900,  unit: 'ședință',   category: 'estetica' },
    { id: 'aparate',    label: 'Aparat dentar fix (metalic)',      min: 1200, avg: 2500, max: 5000, unit: 'arcadă',    category: 'estetica' },
    { id: 'ortodontie', label: 'Aparat transparent (alinere)',     min: 2500, avg: 4500, max: 10000,unit: 'tratament', category: 'estetica' },
    // Chirurgie
    { id: 'chirurgie',  label: 'Extracție simplă',                 min: 80,   avg: 150,  max: 400,  unit: 'dinte',     category: 'chirurgie' },
    { id: 'implanturi', label: 'Implant dentar (titanium)',        min: 1200, avg: 2200, max: 5000, unit: 'implant',   category: 'chirurgie' },
    { id: 'grefe',      label: 'Grefă osoasă',                    min: 800,  avg: 1500, max: 4000, unit: 'procedură', category: 'chirurgie' },
    { id: 'sinuslift',  label: 'Sinus lift',                       min: 1500, avg: 3000, max: 7000, unit: 'procedură', category: 'chirurgie' },
  ];

  get filteredPrices(): ServicePrice[] {
    return this.prices.filter(p => {
      if (this.activeCategory !== 'toate' && p.category !== this.activeCategory) return false;
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        if (!p.label.toLowerCase().includes(q) && !p.id.includes(q)) return false;
      }
      if (this.selectedMaxPrice !== null && p.min > this.selectedMaxPrice) return false;
      return true;
    });
  }

  get activeFiltersCount(): number {
    let n = 0;
    if (this.activeCategory !== 'toate') n++;
    if (this.searchQuery.trim()) n++;
    if (this.selectedMaxPrice !== null) n++;
    if (this.selectedCity) n++;
    return n;
  }

  clinicsRoute(serviceId: string): string[] {
    if (this.selectedCity) {
      return ['/dentisti', serviceId, this.selectedCity];
    }
    return ['/dentisti', serviceId];
  }

  barWidth(p: ServicePrice): string {
    const range = p.max - p.min;
    if (range === 0) return '50%';
    return ((p.avg - p.min) / range * 100) + '%';
  }

  clearFilters() {
    this.searchQuery = '';
    this.activeCategory = 'toate';
    this.selectedCity = '';
    this.selectedMaxPrice = null;
  }

  setCategory(cat: string) {
    this.activeCategory = cat;
  }

  ngOnInit() {
    this.seo.set({
      title: 'Prețuri stomatologie 2026 — Costuri servicii dentare în România | DentiPro',
      description: 'Află cât costă tratamentele stomatologice în România în 2026: implanturi, aparat dentar, albire, tratament de canal. Prețuri minime, medii și maxime actualizate.',
      canonical: 'https://dentipro.ro/preturi',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Prețuri stomatologie 2026 România',
        description: 'Calculator prețuri tratamente stomatologice România 2026',
        url: 'https://dentipro.ro/preturi',
      },
    });
  }
}
