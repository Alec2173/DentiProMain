import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SeoService } from '../seo.service';

const API = 'https://www.dentipro.ro/api';

@Component({
  selector: 'app-pentru-clinici',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './pentru-clinici.component.html',
  styleUrl: './pentru-clinici.component.css',
})
export class PentruCliniciComponent implements OnInit {
  private seo = inject(SeoService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  leadForm!: FormGroup;
  submitting = false;
  submitted = false;
  submitError = '';
  activeFaq: number | null = null;

  readonly benefits = [
    {
      icon: 'fal fa-search-location',
      title: 'Pacienți din orașul tău',
      desc: 'Apari în căutările pacienților locali care caută exact serviciile tale. Vizibilitate organică garantată.',
    },
    {
      icon: 'fal fa-star',
      title: 'Profil complet și atractiv',
      desc: 'Galerie foto, prețuri, servicii, adresă pe hartă — tot ce un pacient vrea să știe înainte să sune.',
    },
    {
      icon: 'fal fa-calendar-check',
      title: 'Programări online',
      desc: 'Pacienții se pot programa direct din profil. Fără apeluri pierdute, fără secretare suprasolicitată.',
    },
    {
      icon: 'fal fa-chart-line',
      title: 'Statistici și analytics',
      desc: 'Câți pacienți ți-au văzut profilul, câți au dat click pe telefon. Date clare pentru decizii mai bune.',
    },
    {
      icon: 'fal fa-badge-check',
      title: 'Badge „Verificat DentiPro"',
      desc: 'Clinicile verificate inspiră mai multă încredere și primesc de 3× mai multe contacte.',
    },
    {
      icon: 'fal fa-headset',
      title: 'Suport dedicat',
      desc: 'Echipa noastră te ajută să configurezi profilul și să obții maximum de vizibilitate.',
    },
  ];

  readonly plans = [
    {
      name: 'Starter',
      price: 'Gratuit',
      period: 'permanent',
      badge: null,
      featured: false,
      features: ['Profil public', 'Marker pe hartă', '5 imagini galerie', 'Apariție în search'],
    },
    {
      name: 'Growth',
      price: '49 RON',
      period: '/ lună',
      badge: 'Cel mai popular',
      featured: true,
      features: ['Galerie nelimitată', 'Prioritate în căutare', 'Homepage DentiPro', 'Feed pacienți', 'Analytics de bază'],
    },
    {
      name: 'Pro',
      price: '99 RON',
      period: '/ lună',
      badge: null,
      featured: false,
      features: ['Top 3 per oraș', 'Badge Promovat', 'Notificări pacienți 20km', 'Analytics avansat', 'Suport prioritar'],
    },
  ];

  readonly faqs = [
    { q: 'Cât durează înscrierea?', a: 'Completezi formularul în 5 minute. Profilul este activat în 24-48 ore după verificare.' },
    { q: 'Planul Starter este cu adevărat gratuit?', a: 'Da, Starter nu are niciun cost și nu necesită card. Poți face upgrade oricând.' },
    { q: 'Pot schimba planul dacă cresc?', a: 'Absolut. Poți face upgrade sau downgrade din dashboard, fără contracte pe termen lung.' },
    { q: 'Am nevoie de competențe tehnice?', a: 'Nu. Platforma e simplă — completezi câmpurile, încarci fotografii și ești live.' },
    { q: 'DentiPro trimite pacienți și fără programări online?', a: 'Da. Pacienții văd numărul tău de telefon și adresa direct pe profil. Nu ești obligat să activezi programările online.' },
  ];

  ngOnInit() {
    this.seo.set({
      title: 'Software pentru clinici dentare — DentiPro | Găsești mai mulți pacienți',
      description: 'Înscrie-ți clinica pe DentiPro și fii descoperit de mii de pacienți din zona ta. Profil complet, programări online, analytics. Starter complet gratuit.',
      canonical: 'https://dentipro.ro/pentru-clinici',
    });

    this.leadForm = this.fb.group({
      clinicName: ['', [Validators.required, Validators.minLength(2)]],
      city:       ['', [Validators.required, Validators.minLength(2)]],
      name:       ['', [Validators.required, Validators.minLength(2)]],
      phone:      ['', [Validators.required, Validators.pattern(/^[0-9\s\+\-]{9,15}$/)]],
      email:      ['', [Validators.required, Validators.email]],
      plan:       ['starter'],
    });
  }

  get f() { return this.leadForm.controls; }

  toggleFaq(i: number) {
    this.activeFaq = this.activeFaq === i ? null : i;
  }

  submit() {
    if (this.leadForm.invalid || this.submitting) return;
    this.submitting = true;
    this.submitError = '';

    // Trimitem ca mesaj de suport sau la un endpoint dedicat
    this.http.post(`${API}/lead`, this.leadForm.value).subscribe({
      next: () => {
        this.submitted = true;
        this.submitting = false;
      },
      error: (err) => {
        // Dacă nu există endpoint, redirecționăm la formular complet
        if (err.status === 404) {
          window.location.href = '/clinici/inscriere';
        } else {
          this.submitError = 'A apărut o eroare. Încearcă din nou sau scrie-ne pe email.';
        }
        this.submitting = false;
      },
    });
  }
}
