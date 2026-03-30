import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClinicService {
  service_id: string;
  label: string;
  price_type: 'fixed' | 'range' | 'from';
  price_min: number | null;
  price_max: number | null;
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

  /** Încarcă toate clinicile — folosit de hartă */
  loadClinicsAuto(): Observable<Clinic[]> {
    return this.http.get<Clinic[]>(`${this.apiUrl}?mode=map`);
  }

  /** Încarcă o pagină de clinici cu date complete (cards, finder) */
  loadPage(params: { limit?: number; offset?: number; city?: string; service?: string; maxPrice?: number | null }): Observable<ClinicsPage> {
    let p = new HttpParams().set('limit', String(params.limit ?? 24)).set('offset', String(params.offset ?? 0));
    if (params.city)     p = p.set('city', params.city);
    if (params.service)  p = p.set('service', params.service);
    if (params.maxPrice) p = p.set('maxPrice', String(params.maxPrice));
    return this.http.get<ClinicsPage>(this.apiUrl, { params: p });
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
