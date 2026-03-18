import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ViewEncapsulation,
  ViewChild,
} from '@angular/core';

import { ServiciiService } from '../servicii.service';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule, AutoComplete } from 'primeng/autocomplete';

@Component({
  selector: 'app-servicii',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule],
  templateUrl: './servicii.component.html',
  styleUrl: './servicii.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ServiciiComponent implements OnInit {
  constructor(private service: ServiciiService) {}

  @ViewChild('serviceSearch') serviceSearch!: AutoComplete;

  @Output() citySelected = new EventEmitter<string>();

  selectedService: any = null;

  servicii: string[] = [];
  serviceObjects: any[] = [];
  filteredServices: any[] = [];

  preventOpen = false;

  ngOnInit(): void {
    this.servicii = this.service.getServiciuName();

    this.serviceObjects = this.servicii.map((name: string, index: number) => ({
      id: index + 1,
      name: name,
    }));

    this.filteredServices = [...this.serviceObjects];
  }

  filterServices(event: any) {
    const query = event.query?.toLowerCase() || '';

    if (!query) {
      this.filteredServices = [...this.serviceObjects];
      return;
    }

    this.filteredServices = this.serviceObjects.filter((service) =>
      service.name.toLowerCase().includes(query),
    );
  }

  showAllServices() {
    if (this.preventOpen) {
      this.preventOpen = false;
      return;
    }

    this.filteredServices = [...this.serviceObjects];

    setTimeout(() => {
      this.serviceSearch.show();
    });
  }

  onServiceSelect() {
    if (this.selectedService) {
      this.citySelected.emit(this.selectedService.name);
    }

    this.preventOpen = true;

    this.serviceSearch.hide();
  }
}
