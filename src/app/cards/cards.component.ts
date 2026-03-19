import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ClinicDataService } from '../clinic-data.service';
import { DataShareService } from '../data-share.service';
import { FavoritesService } from '../favorites.service';
import { AuthService } from '../auth.service';
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
  favoritedIds = new Set<number>();

  private destroy$ = new Subject<void>();

  constructor(
    private clinicData: ClinicDataService,
    private dataShareService: DataShareService,
    public favorites: FavoritesService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.favorites.loadAll();
    this.favorites.favorited$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(ids => this.favoritedIds = ids);

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
      // suportă atât formatul nou (images[]) cât și cel vechi (clinic_images string JSON)
      let images: string[] = [];
      if (Array.isArray(c.images) && c.images.length > 0) {
        images = c.images;
      } else if (typeof c.clinic_images === 'string') {
        try { images = JSON.parse(c.clinic_images || '[]'); } catch { images = []; }
      }
      return { ...c, images, logo_url: c.logo_url || c.logo_path || null };
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
    const raw = clinic.services;
    if (!raw) return false;
    // format nou: array de obiecte
    if (Array.isArray(raw)) {
      return raw.some((s: any) =>
        s.service_id === serviceId || s.label?.toLowerCase().includes(serviceId.toLowerCase())
      );
    }
    // format vechi: string comma-separated
    return String(raw).toLowerCase().includes(serviceId.toLowerCase());
  }

  toggleFavorite(clinicId: number, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.auth.isLoggedIn) return;
    this.favorites.toggle(clinicId);
  }

  trackByClinicId(_index: number, clinic: any) {
    return clinic.id;
  }
}
