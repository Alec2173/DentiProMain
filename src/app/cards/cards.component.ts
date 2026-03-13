import { Component, OnInit } from '@angular/core';
import { ClinicDataService } from '../clinic-data.service';
import { DataShareService } from '../data-share.service';
import { RouterLink } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [RouterLink, ScrollingModule],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.css',
})
export class CardsComponent implements OnInit {
  clinics: any[] = [];
  city: string = '';
  isLoading: boolean = true;

  constructor(
    private clinicData: ClinicDataService,
    private dataShareService: DataShareService,
  ) {}

  ngOnInit() {
    /* oraș selectat */

    this.dataShareService.city$.subscribe((city) => {
      this.city = city || '';
    });

    /* prima încărcare */

    this.clinicData.loadClinicsAuto().subscribe({
      next: (data) => {
        this.clinics = data.map((c: any) => {
          try {
            return {
              ...c,
              clinic_images_parsed: JSON.parse(c.clinic_images || '[]'),
            };
          } catch {
            return {
              ...c,
              clinic_images_parsed: [],
            };
          }
        });

        this.isLoading = false;
      },

      error: (err) => {
        console.error('Eroare la încărcare clinici:', err);
      },
    });

    /* când se aplică filtre */

    /* când se aplică filtre */

    this.dataShareService.filters$.subscribe((filters) => {
      if (!filters) return;

      this.isLoading = true;

      this.clinicData.loadClinicsAuto(filters).subscribe({
        next: (data) => {
          this.clinics = data.map((c: any) => {
            try {
              return {
                ...c,
                clinic_images_parsed: JSON.parse(c.clinic_images || '[]'),
              };
            } catch {
              return {
                ...c,
                clinic_images_parsed: [],
              };
            }
          });

          this.isLoading = false;
        },

        error: (err) => {
          console.error('Eroare la filtrare clinici:', err);
          this.isLoading = false;
        },
      });
    });
  }

  get filteredClinics() {
    if (!this.city) return this.clinics;
    return this.clinics.filter((c) => c.city === this.city);
  }

  trackByClinicId(index: number, clinic: any) {
    return clinic.id;
  }
}
