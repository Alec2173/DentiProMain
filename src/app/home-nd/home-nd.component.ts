import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ClinicDataService } from '../clinic-data.service';
import { SeoService } from '../seo.service';

import { SearchBoardNdComponent } from './search-board-nd/search-board-nd.component';
import { AppInstallComponent } from './app-install/app-install.component';
import { MobileTextComponent } from './mobile-text/mobile-text.component';
import { PopularClinicsComponent } from './popular-clinics/popular-clinics.component';
import { HowItWorksComponent } from './how-it-works/how-it-works.component';
import { PopularServicesComponent } from './popular-services/popular-services.component';
import { CtaComponent } from './cta/cta.component';

@Component({
  selector: 'app-home-nd',
  imports: [
    SearchBoardNdComponent,
    AppInstallComponent,
    MobileTextComponent,
    PopularClinicsComponent,
    HowItWorksComponent,
    PopularServicesComponent,
    CtaComponent,
  ],
  templateUrl: './home-nd.component.html',
  styleUrl: './home-nd.component.css',
})
export class HomeNdComponent implements OnInit, OnDestroy {
  clinics: any[] = [];

  private seo = inject(SeoService);
  private destroy$ = new Subject<void>();

  constructor(private clinicData: ClinicDataService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.seo.set({
      title: 'DentiPro — Găsește clinica dentară potrivită',
      description: 'Caută și rezervă la clinici dentare din România. Dentist în București, Cluj, Timișoara, Iași, Brașov și alte orașe. Servicii: implant, detartraj, albire, aparat dentar.',
      canonical: 'https://dentipro.ro/',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'DentiPro',
        url: 'https://dentipro.ro',
        logo: 'https://dentipro.ro/logo-new.png',
        description: 'Marketplace dentar — găsește și rezervă la clinici dentare din România.',
        areaServed: 'Romania',
        sameAs: ['https://dentipro.ro'],
      },
    });

    this.clinicData.loadClinicsAuto().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.clinics = data;
      },
      error: () => {},
    });
  }
  trackByClinicId(index: number, clinic: any): number {
    return clinic.id;
  }
}
