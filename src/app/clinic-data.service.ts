import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root',
})
export class ClinicDataService {
  private apiUrl = 'https://www.dentipro.ro/api/clinics';

  constructor(private http: HttpClient) {}

  loadClinicsAuto(filters?: any): Observable<Clinic[]> {
    return this.http.get<Clinic[]>(this.apiUrl);
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
