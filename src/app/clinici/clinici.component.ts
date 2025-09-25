import { Component, OnInit } from '@angular/core';
import { ClinicDataService } from '../clinic-data.service';
@Component({
  standalone: true,
  selector: 'app-clinici',
  templateUrl: './clinici.component.html',
  styleUrls: ['./clinici.component.css'],
})
export class CliniciComponent implements OnInit {
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
