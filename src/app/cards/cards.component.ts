import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ClinicDataService } from '../clinic-data.service';
import { DataShareService } from '../data-share.service';
import { FavoritesService } from '../favorites.service';
import { AuthService } from '../auth.service';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.css',
})
export class CardsComponent implements OnInit, AfterViewInit, OnDestroy {
  clinics: any[] = [];
  isLoading = true;
  isLoadingMore = false;
  hasMore = false;
  total = 0;
  favoritedIds = new Set<number>();

  private city = '';
  private service = '';
  private maxPrice: number | null = null;
  private offset = 0;

  activeService = '';  // exposed to template for price display
  private readonly PAGE_SIZE = 24;
  private destroy$ = new Subject<void>();
  private observer?: IntersectionObserver;

  @ViewChild('sentinel') private sentinelRef!: ElementRef;
  @ViewChild('viewport') private viewportRef!: ElementRef;

  constructor(
    private clinicData: ClinicDataService,
    private dataShareService: DataShareService,
    public favorites: FavoritesService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.favorites.loadAll();
    this.favorites.favorited$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(ids => this.favoritedIds = ids);

    this.dataShareService.city$
      .pipe(takeUntil(this.destroy$))
      .subscribe(city => { this.city = city || ''; this.reload(); });

    this.dataShareService.service$
      .pipe(takeUntil(this.destroy$))
      .subscribe(service => { this.service = service || ''; this.activeService = this.service; this.reload(); });

    this.dataShareService.maxPrice$
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => { this.maxPrice = p; this.reload(); });

    this.loadPage(true);
  }

  ngAfterViewInit() {
    this.setupObserver();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupObserver() {
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && this.hasMore && !this.isLoadingMore && !this.isLoading) {
        this.loadMore();
      }
    }, {
      root: this.viewportRef?.nativeElement ?? null,
      rootMargin: '200px',
    });
    if (this.sentinelRef) this.observer.observe(this.sentinelRef.nativeElement);
  }

  private reload() {
    this.offset = 0;
    this.clinics = [];
    this.loadPage(true);
  }

  private loadPage(initial = false) {
    if (initial) this.isLoading = true;
    else this.isLoadingMore = true;

    this.clinicData.loadPage({ limit: this.PAGE_SIZE, offset: this.offset, city: this.city || undefined, service: this.service || undefined, maxPrice: this.maxPrice })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          // Parse then apply client-side price post-filter as a reliable fallback
          const parsed = this.parseClinics(res.clinics).filter(c => this.matchesPrice(c));
          this.clinics = initial ? parsed : [...this.clinics, ...parsed];
          this.total = res.total;
          this.hasMore = res.hasMore;
          this.offset += parsed.length;
          this.isLoading = false;
          this.isLoadingMore = false;
          this.cdr.detectChanges();
          // Re-osservă sentinel-ul după ce DOM-ul s-a actualizat
          if (this.hasMore && this.sentinelRef) {
            this.setupObserver();
          }
        },
        error: () => {
          this.isLoading = false;
          this.isLoadingMore = false;
        },
      });
  }

  loadMore() {
    if (!this.hasMore || this.isLoadingMore) return;
    this.loadPage(false);
  }

  private parseClinics(data: any[]): any[] {
    return data.map((c) => {
      let images: string[] = [];
      if (Array.isArray(c.images) && c.images.length > 0) {
        images = c.images;
      } else if (typeof c.clinic_images === 'string') {
        try { images = JSON.parse(c.clinic_images || '[]'); } catch { images = []; }
      }
      return { ...c, images, logo_url: c.logo_url || c.logo_path || null };
    });
  }

  /** Client-side price filter fallback — ensures maxPrice is respected even if backend doesn't filter */
  private matchesPrice(clinic: any): boolean {
    if (!this.maxPrice) return true;
    const services: any[] = clinic.services || [];
    if (!services.length) return false;

    if (this.service) {
      const norm = this.normalizeRo(this.service);
      const svc = services.find((s: any) =>
        String(s.service_id) === this.service ||
        this.normalizeRo(s.label || '').includes(norm)
      );
      return !!svc && svc.price_min !== null && svc.price_min <= this.maxPrice!;
    }

    // No service filter: at least one service must be within budget
    return services.some((s: any) => s.price_min !== null && s.price_min <= this.maxPrice!);
  }

  private normalizeRo(s: string): string {
    return s.toLowerCase()
      .replace(/[ăâ]/g, 'a')
      .replace(/î/g, 'i')
      .replace(/[șş]/g, 's')
      .replace(/[țţ]/g, 't');
  }

  /** Returns { label, price } for the active service on a given clinic */
  getServiceInfo(clinic: any): { label: string; price: string | null } | null {
    if (!this.activeService || !clinic.services?.length) return null;
    const norm = this.normalizeRo(this.activeService);
    const svc = clinic.services.find((s: any) =>
      String(s.service_id) === this.activeService ||
      (s.label && this.normalizeRo(s.label).includes(norm))
    );
    if (!svc) return null;
    const min = svc.price_min;
    const max = svc.price_max;
    let price: string | null = null;
    if (clinic.show_prices !== false) {
      if (min !== null && max !== null && min !== max) price = `${min} – ${max} lei`;
      else if (svc.price_type === 'from' && min !== null) price = `de la ${min} lei`;
      else if (min !== null) price = `${min} lei`;
      else if (max !== null) price = `${max} lei`;
    }
    return { label: svc.label ?? '', price };
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
