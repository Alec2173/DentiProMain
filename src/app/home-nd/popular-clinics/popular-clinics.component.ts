import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ClinicDataService } from '../../clinic-data.service';
import { cloudinaryCard, cloudinaryLogo, getInitials } from '../../utils/text.utils';

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
    return cloudinaryCard(clinic.images?.[0] ?? '', 480, 400);
  }

  getLogoSrc(url: string): string { return cloudinaryLogo(url, 80); }
  readonly getInitials = getInitials;

  loadedImages = new Set<number>();
  errorImages  = new Set<number>();
  onImgLoad(id: number)  { this.loadedImages.add(id); }
  onImgError(id: number) { this.errorImages.add(id); this.loadedImages.delete(id); }
  isImgLoaded(id: number)  { return this.loadedImages.has(id); }
  isImgError(id: number)   { return this.errorImages.has(id); }
}
