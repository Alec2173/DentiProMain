import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';

const PLAN_RANK: Record<string, number> = { pro: 0, growth: 1, starter: 2 };

export interface ClinicService {
  service_id: string;
  label: string;
  price_type: 'fixed' | 'range' | 'from';
  price_min: number | null;
  price_max: number | null;
}

export interface WorkingDay {
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface Clinic {
  id: number;
  name: string;
  email: string;
  phone_public: string;
  phone_manager: string;
  city: string;
  address: string;
  logo_url: string;
  images: string[];
  services: ClinicService[];
  show_prices: boolean;
  additional_notes: string;
  latitude: number;
  longitude: number;
  plan: string;
  status: string;
  working_hours?: Record<string, WorkingDay> | null;
}

export interface ClinicsPage {
  clinics: Clinic[];
  total: number;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ClinicDataService {
  private apiUrl = 'https://www.dentipro.ro/api/clinics';

  constructor(private http: HttpClient) {}

  private sortByPlan(clinics: Clinic[]): Clinic[] {
    return [...clinics].sort((a, b) =>
      (PLAN_RANK[a.plan] ?? 2) - (PLAN_RANK[b.plan] ?? 2)
    );
  }

  private clinicsAuto$?: Observable<Clinic[]>;

  /** Încarcă toate clinicile — folosit de hartă și search navbar. Rezultatul e cached per sesiune. */
  loadClinicsAuto(): Observable<Clinic[]> {
    if (!this.clinicsAuto$) {
      this.clinicsAuto$ = this.http.get<Clinic[]>(`${this.apiUrl}?mode=map`).pipe(
        map(clinics => this.sortByPlan(clinics)),
        shareReplay(1),
      );
    }
    return this.clinicsAuto$;
  }

  /** Invalidează cache-ul de clinici (apelat după modificări majore) */
  invalidateClinicsCache(): void {
    this.clinicsAuto$ = undefined;
  }

  /** Încarcă clinicile vizibile în viewport-ul hărții (folosit de zoom/pan pe hartă) */
  loadClinicsInBounds(bounds: { swLat: number; swLng: number; neLat: number; neLng: number }): Observable<Clinic[]> {
    const p = new HttpParams()
      .set('mode', 'map')
      .set('swLat', String(bounds.swLat))
      .set('swLng', String(bounds.swLng))
      .set('neLat', String(bounds.neLat))
      .set('neLng', String(bounds.neLng));
    return this.http.get<Clinic[]>(this.apiUrl, { params: p }).pipe(
      map(clinics => this.sortByPlan(clinics)),
    );
  }

  /** Încarcă o pagină de clinici cu date complete (cards, finder) */
  loadPage(params: {
    limit?: number; offset?: number; city?: string; service?: string; maxPrice?: number | null;
    swLat?: number; swLng?: number; neLat?: number; neLng?: number;
  }): Observable<ClinicsPage> {
    let p = new HttpParams().set('limit', String(params.limit ?? 24)).set('offset', String(params.offset ?? 0));
    if (params.swLat != null) {
      p = p.set('swLat', String(params.swLat))
           .set('swLng', String(params.swLng))
           .set('neLat', String(params.neLat))
           .set('neLng', String(params.neLng));
    } else if (params.city) {
      p = p.set('city', params.city);
    }
    if (params.service)  p = p.set('service', params.service);
    if (params.maxPrice) p = p.set('maxPrice', String(params.maxPrice));
    return this.http.get<ClinicsPage>(this.apiUrl, { params: p }).pipe(
      map(page => ({ ...page, clinics: this.sortByPlan(page.clinics) }))
    );
  }

  /** Încarcă clinicile după o listă de ID-uri specifice (folosit de sincronizarea cu harta) */
  loadByIds(ids: number[]): Observable<Clinic[]> {
    const p = new HttpParams().set('ids', ids.join(','));
    return this.http.get<Clinic[]>(this.apiUrl, { params: p });
  }

  getClinicById(id: number): Observable<Clinic> {
    return this.http.get<Clinic>(`${this.apiUrl}/${id}`);
  }

  updateClinic(id: number, data: Partial<Clinic>, token: string): Observable<Clinic> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.patch<Clinic>(`${this.apiUrl}/${id}`, data, { headers });
  }

  updateServices(id: number, services: any[], token: string): Observable<Clinic> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.put<Clinic>(`${this.apiUrl}/${id}/services`, { services }, { headers });
  }
}
