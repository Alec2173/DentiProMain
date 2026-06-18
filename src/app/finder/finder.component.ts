import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MapComponent } from '../map/map.component';
import { CardsComponent } from '../cards/cards.component';
import { FilterNavComponent } from '../filter-nav/filter-nav.component';
import { DataShareService } from '../data-share.service';
import { SeoService } from '../seo.service';
import { AnalyticsService } from '../analytics.service';

@Component({
  selector: 'app-finder',
  imports: [MapComponent, CardsComponent, FilterNavComponent],
  templateUrl: './finder.component.html',
  styleUrl: './finder.component.css',
})
export class FinderComponent implements OnInit, OnDestroy {
  activeTab: 'map' | 'list' = 'list';

  private seo = inject(SeoService);
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private dataShareService: DataShareService,
    private analytics: AnalyticsService,
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const city = params['city'] || '';
      const service = params['service'] || '';

      const cityLabel = city ? ` în ${city}` : ' din România';
      const serviceLabel = service ? `${service} — ` : '';

      this.seo.set({
        title: `${serviceLabel}Clinici dentare${cityLabel} | DentiPro`,
        description: `Găsește clinici dentare${cityLabel}. ${service ? service + ' și alte servicii stomatologice.' : 'Implant, detartraj, albire, aparat dentar și multe altele.'} Caută pe hartă și rezervă rapid.`,
        canonical: `https://dentipro.ro/finder${city ? '?city=' + city : ''}`,
      });

      this.dataShareService.setCity(city);
      this.dataShareService.setService(service);

      if (city || service) {
        this.dataShareService.setFilters({ city, service });
        this.analytics.searchPerformed(city, service);
      }
    });
  }
}
