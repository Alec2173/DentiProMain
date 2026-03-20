import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapComponent } from '../map/map.component';
import { CardsComponent } from '../cards/cards.component';
import { FilterNavComponent } from '../filter-nav/filter-nav.component';
import { DataShareService } from '../data-share.service';
import { SeoService } from '../seo.service';

@Component({
  selector: 'app-finder',
  imports: [MapComponent, CardsComponent, FilterNavComponent],
  templateUrl: './finder.component.html',
  styleUrl: './finder.component.css',
})
export class FinderComponent implements OnInit {
  activeTab: 'map' | 'list' = 'list';

  private seo = inject(SeoService);

  constructor(
    private route: ActivatedRoute,
    private dataShareService: DataShareService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
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
      }
    });
  }
}
