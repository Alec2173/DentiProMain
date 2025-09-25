import { Component, OnInit } from '@angular/core';
import { ClinicDataService } from '../clinic-data.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-descripton-page',
  imports: [CommonModule],
  templateUrl: './descripton-page.component.html',
  styleUrl: './descripton-page.component.css',
})
export class DescriptonPageComponent implements OnInit {
  constructor(
    private clinicData: ClinicDataService,
    private route: ActivatedRoute
  ) {}
  clinics: any = {};
  isLoading: boolean = true;
  clinicImages: string[] = [];
  activeImageIndex = 0;
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.clinicData.loadClinicsAuto().subscribe({
      next: (data) => {
        this.clinics = data.find((c: any) => c.id == id);

        try {
          this.clinicImages = JSON.parse(this.clinics.clinic_images || '[]');
        } catch (e) {
          this.clinicImages = [];
        }

        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }

  trackByClinicId(index: number, clinic: any): number {
    return clinic.id;
  }
}
