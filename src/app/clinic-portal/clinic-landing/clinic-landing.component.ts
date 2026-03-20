import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { SeoService } from '../../seo.service';

@Component({
  selector: 'app-clinic-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './clinic-landing.component.html',
  styleUrl: './clinic-landing.component.css',
})
export class ClinicLandingComponent implements OnInit {
  activeFaq: number | null = null;

  private seo = inject(SeoService);

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.auth.isAdmin) this.router.navigate(['/administrator']);

    this.seo.set({
      title: 'Înscrie-ți clinica dentară pe DentiPro | Găsești pacienți noi',
      description: 'Adaugă clinica ta pe DentiPro și fii descoperit de mii de pacienți din orașul tău. Profil complet, marker pe hartă, programări online. Starter gratuit.',
      canonical: 'https://dentipro.ro/clinici',
    });
  }

  readonly stats = [
    { value: '70+', label: 'Clinici înscrise' },
    { value: '98%', label: 'Satisfacție clinici' },
  ];

  readonly features = [
    {
      icon: 'search',
      title: 'Vizibilitate maximă',
      desc: 'Clinica ta apare în rezultatele de search ale pacienților din zona ta, în funcție de servicii și locație.',
    },
    {
      icon: 'map',
      title: 'Marker pe harta interactivă',
      desc: 'Pacienții te găsesc direct pe harta DentiPro. Marker vizibil, adresă exactă, navigație one-click.',
    },
    {
      icon: 'photo_library',
      title: 'Galerie foto & video',
      desc: 'Prezintă clinica cu imagini profesionale. Planul Growth și Pro permit galerie nelimitată.',
    },
    {
      icon: 'analytics',
      title: 'Analytics & rapoarte',
      desc: 'Urmărește câți pacienți ți-au văzut profilul, au dat click pe telefon sau au salvat clinica la favorite.',
    },
    {
      icon: 'notifications_active',
      title: 'Notificări pacienți din zonă',
      desc: 'Trimite notificări pacienților în raza de 20km când ai oferte sau locuri disponibile.',
    },
    {
      icon: 'workspace_premium',
      title: 'Banderolă Promovat',
      desc: 'Clinica ta apare cu badge "Promovat" în search, diferențiindu-te instant față de competiție.',
    },
  ];

  readonly plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 0,
      period: 'permanent gratuit',
      badge: null,
      featured: false,
      features: ['Profil public', 'Marker pe hartă', '5 imagini', 'Apariție în search'],
      missing: ['Feed pacienți', 'Analytics', 'Notificări'],
      cta: 'Începe gratuit',
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 49,
      period: '/ lună',
      badge: 'Cel mai ales',
      featured: true,
      features: ['Galerie nelimitată', 'Prioritate în search', 'Apariție pe homepage', 'Feed pacienți — 10 oferte/lună', 'Analytics de bază'],
      missing: ['Notificări 20km', 'Banderolă Promovat'],
      cta: 'Activează Growth',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 99,
      period: '/ lună',
      badge: null,
      featured: false,
      features: ['Top 3 în search per oraș', 'Banderolă Promovat', 'Oferte nelimitate', 'Notificări pacienți 20km', 'Analytics avansat', 'Suport prioritar 24h'],
      missing: [],
      cta: 'Activează Pro',
    },
  ];

  readonly faqs = [
    { q: 'Este obligatoriu să plătesc pentru a fi pe platformă?', a: 'Nu. Planul Starter este permanent gratuit și include profil public, marker pe hartă și apariție în rezultatele de search.' },
    { q: 'Cât durează până apare clinica mea pe platformă?', a: 'Profilul este verificat și publicat în maxim 24-48 ore de la completarea formularului de înregistrare.' },
    { q: 'Pot schimba planul oricând?', a: 'Da, poți face upgrade sau downgrade oricând din dashboard-ul clinicii, fără penalizări.' },
    { q: 'Cum funcționează notificările pentru pacienți?', a: 'Planul Pro include trimiterea de notificări push pacienților care se află în raza de 20km față de clinica ta, atunci când publici oferte sau ai locuri disponibile.' },
  ];

  toggleFaq(i: number) {
    this.activeFaq = this.activeFaq === i ? null : i;
  }
}
