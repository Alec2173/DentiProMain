import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
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
export class CardsComponent implements OnInit, OnDestroy {
  clinics: any[] = [];
  city = '';
  service = '';
  isLoading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private clinicData: ClinicDataService,
    private dataShareService: DataShareService,
  ) {}

  ngOnInit() {
    this.dataShareService.city$
      .pipe(takeUntil(this.destroy$))
      .subscribe((city) => { this.city = city || ''; });

    this.dataShareService.service$
      .pipe(takeUntil(this.destroy$))
      .subscribe((service) => { this.service = service || ''; });

    this.clinicData.loadClinicsAuto()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.clinics = this.parseClinics(data);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Eroare la încărcare clinici:', err);
          this.isLoading = false;
        },
      });

    this.dataShareService.filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters) => {
        if (!filters) return;
        this.isLoading = true;
        this.clinicData.loadClinicsAuto(filters)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (data) => {
              this.clinics = this.parseClinics(data);
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Eroare la filtrare clinici:', err);
              this.isLoading = false;
            },
          });
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private parseClinics(data: any[]): any[] {
    return data.map((c) => {
      try {
        return {
          ...c,
          clinic_images_parsed: typeof c.clinic_images === 'string'
            ? JSON.parse(c.clinic_images || '[]')
            : (c.clinic_images ?? []),
        };
      } catch {
        return { ...c, clinic_images_parsed: [] };
      }
    });
  }

  get filteredClinics() {
    return this.clinics.filter((c) => {
      const cityMatch = !this.city || c.city === this.city;
      const serviceMatch = !this.service || this.clinicHasService(c, this.service);
      return cityMatch && serviceMatch;
    });
  }

  private clinicHasService(clinic: any, serviceId: string): boolean {
    if (!clinic.services) return false;
    const raw = clinic.services;
    try {
      const arr: string[] = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(arr) && arr.some((s) => s.toLowerCase().includes(serviceId.toLowerCase()));
    } catch {
      return String(raw).toLowerCase().includes(serviceId.toLowerCase());
    }
  }

  trackByClinicId(_index: number, clinic: any) {
    return clinic.id;
  }
}
