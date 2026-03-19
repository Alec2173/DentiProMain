import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DataShareService } from '../data-share.service';
import { RoCitiesService } from '../ro-cities.service';
import { ServiciiService } from '../servicii.service';

@Component({
  selector: 'app-filter-nav',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter-nav.component.html',
  styleUrl: './filter-nav.component.css',
})
export class FilterNavComponent implements OnInit, OnDestroy {
  // City: input text = filter + display
  searchCity = '';
  cityDropdownOpen = false;

  // Service: serviceText = what user types / label shown; searchService = selected id
  serviceText = '';
  searchService = '';
  serviceDropdownOpen = false;

  cities: string[] = [];
  services: { id: string; label: string }[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private dataShareService: DataShareService,
    private roCitiesService: RoCitiesService,
    private serviciiService: ServiciiService,
  ) {}

  ngOnInit() {
    this.cities = this.roCitiesService.getCities();
    this.services = this.serviciiService.getServices();

    this.dataShareService.city$
      .pipe(takeUntil(this.destroy$))
      .subscribe((city) => { this.searchCity = city || ''; });

    this.dataShareService.service$
      .pipe(takeUntil(this.destroy$))
      .subscribe((serviceId) => {
        this.searchService = serviceId || '';
        if (serviceId) {
          const found = this.services.find((s) => s.id === serviceId);
          this.serviceText = found?.label ?? '';
        } else {
          this.serviceText = '';
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredCities(): string[] {
    const q = this.searchCity.toLowerCase();
    if (!q) return this.cities.slice(0, 12);
    return this.cities.filter((c) => c.toLowerCase().includes(q)).slice(0, 12);
  }

  get filteredServices(): { id: string; label: string }[] {
    const q = this.serviceText.toLowerCase();
    if (!q) return this.services;
    return this.services.filter((s) => s.label.toLowerCase().includes(q));
  }

  // ── CITY ──────────────────────────────────
  onCityInput() {
    this.cityDropdownOpen = true;
    this.serviceDropdownOpen = false;
  }

  onCityFocus(e: Event) {
    e.stopPropagation();
    this.cityDropdownOpen = true;
    this.serviceDropdownOpen = false;
  }

  selectCity(city: string) {
    this.searchCity = city;
    this.cityDropdownOpen = false;
  }

  clearCity() {
    this.searchCity = '';
    this.cityDropdownOpen = false;
  }

  // ── SERVICE ───────────────────────────────
  onServiceInput() {
    this.serviceDropdownOpen = true;
    this.cityDropdownOpen = false;
    if (this.searchService) {
      this.searchService = '';
    }
  }

  onServiceFocus(e: Event) {
    e.stopPropagation();
    this.serviceDropdownOpen = true;
    this.cityDropdownOpen = false;
  }

  selectService(service: { id: string; label: string }) {
    this.searchService = service.id;
    this.serviceText = service.label;
    this.serviceDropdownOpen = false;
  }

  clearService() {
    this.searchService = '';
    this.serviceText = '';
    this.serviceDropdownOpen = false;
  }

  // ── GLOBAL ────────────────────────────────
  closeAll() {
    this.cityDropdownOpen = false;
    this.serviceDropdownOpen = false;
  }

  apply() {
    this.dataShareService.setCity(this.searchCity);
    this.dataShareService.setService(this.searchService);
    this.dataShareService.setFilters({ city: this.searchCity, service: this.searchService });
    this.closeAll();
  }
}
