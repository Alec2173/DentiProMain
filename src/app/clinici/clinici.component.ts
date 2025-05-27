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
    this.clinicData.getClinics().subscribe({
      next: (data) => {
        this.clinics = data;
        console.log('Date primite în componentă:', this.clinics);
      },
      error: (err) => console.error('Eroare la preluare:', err),
    });
  }
  trackByClinicId(index: number, clinic: any): number {
    return clinic.id;
  }
}
