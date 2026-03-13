import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { OraseComponent } from '../orase/orase.component';
import { ServiciiComponent } from '../servicii/servicii.component';
import { DataShareService } from '../data-share.service';

@Component({
  selector: 'app-filter-nav',
  standalone: true,
  imports: [OraseComponent, ServiciiComponent],
  templateUrl: './filter-nav.component.html',
  styleUrl: './filter-nav.component.css',
})
export class FilterNavComponent implements OnInit {
  constructor(private dataShareService: DataShareService) {}

  @Output() filterChange = new EventEmitter<any>();

  data: any = {
    oras: '',
  };

  ngOnInit(): void {}

  onSubmit() {
    const filters = {
      city: this.data.oras,
    };

    console.log('Filters:', filters);

    /* trimite filtrele */

    this.dataShareService.setFilters(filters);

    /* actualizează și city pentru filtrarea din cards */

    this.dataShareService.setCity(this.data.oras);
  }
}
