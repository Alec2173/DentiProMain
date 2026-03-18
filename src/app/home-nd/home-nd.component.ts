import { Component, OnInit } from '@angular/core';
import { ClinicDataService } from '../clinic-data.service';

import { SearchBoardNdComponent } from './search-board-nd/search-board-nd.component';
import { AppInstallComponent } from './app-install/app-install.component';
import { MobileTextComponent } from './mobile-text/mobile-text.component';
import { PopularClinicsComponent } from './popular-clinics/popular-clinics.component';
import { HowItWorksComponent } from './how-it-works/how-it-works.component';
import { PopularServicesComponent } from './popular-services/popular-services.component';
import { Footer } from 'primeng/api';
import { FooterComponent } from './footer/footer.component';
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
    FooterComponent,
    CtaComponent,
  ],
  templateUrl: './home-nd.component.html',
  styleUrl: './home-nd.component.css',
})
export class HomeNdComponent implements OnInit {
  clinics: any[] = [];

  constructor(private clinicData: ClinicDataService) {}

  ngOnInit() {
    this.clinicData.loadClinicsAuto().subscribe({
      next: (data) => {
        this.clinics = data;
      },
      error: (err) => {
        console.error('Eroare la încărcare clinici:', err);
      },
    });
  }
  trackByClinicId(index: number, clinic: any): number {
    return clinic.id;
  }
}
