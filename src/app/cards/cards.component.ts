import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ClinicDataService } from '../clinic-data.service';
import { DataShareService } from '../data-share.service';
import { FavoritesService } from '../favorites.service';
import { AuthService } from '../auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [RouterLink],
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
  private offset = 0;
  private readonly PAGE_SIZE = 24;
  private destroy$ = new Subject<void>();
  private observer?: IntersectionObserver;

  @ViewChild('sentinel') private sentinelRef!: ElementRef;

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
      .subscribe(city => { this.city = city || ''; this.reload(); });

    this.dataShareService.service$
      .pipe(takeUntil(this.destroy$))
      .subscribe(service => { this.service = service || ''; this.reload(); });

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
    }, { rootMargin: '300px' });
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

    this.clinicData.loadPage({ limit: this.PAGE_SIZE, offset: this.offset, city: this.city || undefined, service: this.service || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const parsed = this.parseClinics(res.clinics);
          this.clinics = initial ? parsed : [...this.clinics, ...parsed];
          this.total = res.total;
          this.hasMore = res.hasMore;
          this.offset += parsed.length;
          this.isLoading = false;
          this.isLoadingMore = false;
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
