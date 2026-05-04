import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil, combineLatest, debounceTime } from 'rxjs';
import { ClinicDataService } from '../clinic-data.service';
import { DataShareService, MapBounds } from '../data-share.service';
import { FavoritesService } from '../favorites.service';
import { AuthService } from '../auth.service';
import { AnalyticsService } from '../analytics.service';
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
  private bounds: MapBounds | null = null;
  private offset = 0;

  activeService = '';
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
    private analytics: AnalyticsService,
  ) {}

  ngOnInit() {
    this.favorites.loadAll();
    this.favorites.favorited$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(ids => this.favoritedIds = ids);

    combineLatest([
      this.dataShareService.city$,
      this.dataShareService.service$,
      this.dataShareService.maxPrice$,
      this.dataShareService.bounds$,
    ]).pipe(
      debounceTime(60),
      takeUntil(this.destroy$),
    ).subscribe(([city, service, maxPrice, bounds]) => {
      this.city = city || '';
      this.service = service || '';
      this.activeService = this.service;
      this.maxPrice = maxPrice;
      this.bounds = bounds;
      this.reload();
    });
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

    const params: Parameters<typeof this.clinicData.loadPage>[0] = {
      limit: this.PAGE_SIZE,
      offset: this.offset,
      service: this.service || undefined,
      maxPrice: this.maxPrice,
    };

    if (this.bounds) {
      params.swLat = this.bounds.swLat;
      params.swLng = this.bounds.swLng;
      params.neLat = this.bounds.neLat;
      params.neLng = this.bounds.neLng;
    } else if (this.city) {
      params.city = this.city;
    }

    this.clinicData.loadPage(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const raw = this.parseClinics(res.clinics);
          const filtered = raw.filter(c => this.matchesPrice(c));
          this.clinics = initial ? filtered : [...this.clinics, ...filtered];
          this.total = res.total;
          this.hasMore = res.hasMore;
          this.offset += raw.length;
          this.isLoading = false;
          this.isLoadingMore = false;
          this.cdr.detectChanges();
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
    const planRank = (p: string) => p === 'pro' ? 0 : p === 'growth' ? 1 : 2;
    return data
      .map((c) => {
        let images: string[] = [];
        if (Array.isArray(c.images) && c.images.length > 0) {
          images = c.images;
        } else if (typeof c.clinic_images === 'string') {
          try { images = JSON.parse(c.clinic_images || '[]'); } catch { images = []; }
        }
        return { ...c, images, logo_url: c.logo_url || c.logo_path || null };
      })
      .sort((a, b) => planRank(a.plan) - planRank(b.plan));
  }

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

    return services.some((s: any) => s.price_min !== null && s.price_min <= this.maxPrice!);
  }

  private normalizeRo(s: string): string {
    return s.toLowerCase()
      .replace(/[ăâ]/g, 'a')
      .replace(/î/g, 'i')
      .replace(/[șş]/g, 's')
      .replace(/[țţ]/g, 't');
  }

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

  onClinicClick(clinic: any) {
    this.analytics.clinicCardClicked(clinic.id, clinic.name, 'cards');
  }

  toggleFavorite(clinicId: number, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.auth.isLoggedIn) return;
    const action = this.favorites.isFavorited(clinicId) ? 'removed' : 'added';
    this.favorites.toggle(clinicId);
    this.analytics.favoriteToggled(clinicId, action);
  }

  trackByClinicId(_index: number, clinic: any) {
    return clinic.id;
  }

  clinicInitials(name: string): string {
    if (!name) return '?';
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return (words[0]?.[0] || '?').toUpperCase();
  }
}
