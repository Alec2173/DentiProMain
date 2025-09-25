import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClinicDataService } from '../clinic-data.service';
@Component({
  selector: 'app-description',
  imports: [RouterLink],
  templateUrl: './description.component.html',
  styleUrl: './description.component.css',
})
export class DescriptionComponent {
  constructor(private clinicData: ClinicDataService) {}
  clinics: any = {};
  isLoading: boolean = true;

  ngOnInit() {
    console.log('Loading clinics...');
    this.clinicData.loadClinicsAuto().subscribe({
      next: (data) => {
        this.clinics = data;
        this.isLoading = false;
        console.log('Clinics loaded:', this.clinics); // Set loading to false after data is loaded
      },
      error: (err) => {
        console.error('Eroare la încărcare clinici:', err);
        this.isLoading = false; // Set loading to false on error as well
      },
    });
  }

  trackByClinicId(index: number, clinic: any): number {
    return clinic.id;
  }
}
