import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapComponent } from '../map/map.component';
import { CardsComponent } from '../cards/cards.component';
import { FilterNavComponent } from '../filter-nav/filter-nav.component';
import { DataShareService } from '../data-share.service';

@Component({
  selector: 'app-finder',
  imports: [MapComponent, CardsComponent, FilterNavComponent],
  templateUrl: './finder.component.html',
  styleUrl: './finder.component.css',
})
export class FinderComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private dataShareService: DataShareService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const city = params['city'] || '';
      const service = params['service'] || '';

      this.dataShareService.setCity(city);
      this.dataShareService.setService(service);

      if (city || service) {
        this.dataShareService.setFilters({ city, service });
      }
    });
  }
}
