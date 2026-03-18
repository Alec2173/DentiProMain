import { Component } from '@angular/core';
import { MapComponent } from '../map/map.component';
import { CardsComponent } from '../cards/cards.component';
import { FilterNavComponent } from '../filter-nav/filter-nav.component';

@Component({
  selector: 'app-finder',
  imports: [MapComponent, CardsComponent, FilterNavComponent],
  templateUrl: './finder.component.html',
  styleUrl: './finder.component.css',
})
export class FinderComponent {
  currentFilter: any = {};

  onFilterChange(filter: any) {
    this.currentFilter = filter;
  }
}
