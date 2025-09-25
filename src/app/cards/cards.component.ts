import { Component, OnInit } from '@angular/core';
import { ClinicDataService } from '../clinic-data.service';
import { DataShareService } from '../data-share.service';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-cards',
  imports: [RouterLink],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.css',
})
export class CardsComponent implements OnInit {
  constructor(
    private clinicData: ClinicDataService,
    private dataShareService: DataShareService
  ) {}
  clinics: any[] = [];
  city: any = '';
  clinicImages: string[] = [];
  isLoading: boolean = true;
  ngOnInit() {
    this.dataShareService.city$.subscribe((city) => {
      if (city) {
        this.city = city;

        // Poți folosi `city` cum vrei în cards
      }
    });
    this.clinicData.loadClinicsAuto().subscribe({
      next: (data) => {
        this.clinics = data;
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
  }
  trackByClinicId(index: number, clinic: any): number {
    return clinic.id;
  }
}
