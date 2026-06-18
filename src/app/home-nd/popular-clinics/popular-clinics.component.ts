import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ClinicDataService } from '../../clinic-data.service';

@Component({
  selector: 'app-popular-clinics',
  imports: [RouterLink],
  templateUrl: './popular-clinics.component.html',
  styleUrl: './popular-clinics.component.css',
})
export class PopularClinicsComponent implements OnInit, OnDestroy {
  clinics: any[] = [];
  isLoading = true;

  private destroy$ = new Subject<void>();

  constructor(private clinicData: ClinicDataService) {}

  ngOnInit() {
    this.clinicData.loadClinicsAuto()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Pro primele, Growth urmează, restul la final
          const sorted = [...data].sort((a, b) => {
            const rank = (p: string) => p === 'pro' ? 0 : p === 'growth' ? 1 : 2;
            return rank(a.plan) - rank(b.plan);
          });
          this.clinics = sorted.slice(0, 3);
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCoverImage(clinic: any): string {
    return clinic.images?.[0] ?? '';
  }
}
