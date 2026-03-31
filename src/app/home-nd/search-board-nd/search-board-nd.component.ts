import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ServiciiService } from '../../servicii.service';
import { RoCitiesService } from '../../ro-cities.service';

@Component({
  selector: 'app-search-board-nd',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-board-nd.component.html',
  styleUrl: './search-board-nd.component.css',
})
export class SearchBoardNdComponent implements OnInit {
  stats: { clinics: number; cities: number; reviews: number; appointments: number } | null = null;
  // City: input text = filter + display
  searchCity = '';
  cityDropdownOpen = false;

  // Service: serviceText = what user types / label shown; searchService = selected id
  serviceText = '';
  searchService = '';
  serviceDropdownOpen = false;

  services: { id: string; label: string }[] = [];
  cities: string[] = [];

  constructor(
    private router: Router,
    private serviciiService: ServiciiService,
    private roCitiesService: RoCitiesService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.services = this.serviciiService.getServices();
    this.cities = this.roCitiesService.getCities();
    this.http.get<any>('https://www.dentipro.ro/api/stats/public').subscribe({
      next: (s) => { this.stats = s; },
      error: () => {},
    });
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
    // Clear selection if user is editing
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

  search() {
    const params: Record<string, string> = {};
    if (this.searchCity) params['city'] = this.searchCity;
    if (this.searchService) params['service'] = this.searchService;
    this.router.navigate(['/finder'], { queryParams: params });
  }
}
