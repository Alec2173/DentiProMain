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
  displayLimit = 20;

  constructor(private clinicData: ClinicDataService) {}

  ngOnInit() {
    this.clinicData.loadClinicsAuto().subscribe({
      next: (data) => { this.clinics = data; },
      error: (err) => { console.error('Eroare la încărcare clinici:', err); },
    });
  }

  get displayedClinics() { return this.clinics.slice(0, this.displayLimit); }
  get hasMore() { return this.displayLimit < this.clinics.length; }
  showMore() { this.displayLimit += 20; }

  trackByClinicId(index: number, clinic: any): number { return clinic.id; }
}
