import { Component } from '@angular/core';
import { ClinicDataService } from '../clinic-data.service';
import { CalendarComponent } from '../calendar/calendar.component';
import { SearchBoardNdComponent } from './search-board-nd/search-board-nd.component';

@Component({
  selector: 'app-home-nd',
  imports: [CalendarComponent, SearchBoardNdComponent],
  templateUrl: './home-nd.component.html',
  styleUrl: './home-nd.component.css',
})
export class HomeNdComponent {
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
