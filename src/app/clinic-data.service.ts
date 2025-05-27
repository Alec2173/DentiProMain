import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs';
export interface Clinic {
  id: number;
  name: string;
  phone: string;
  email: string;
  services: string;
  city: string;
  logo_path: string;
  clinic_images: string[]; // e stocat ca JSON în SQL
  client_phone: string;
  client_email: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClinicDataService {
  private apiUrl = 'http://localhost:3000/clinics';

  constructor(private http: HttpClient) {}

  getClinics(): Observable<Clinic[]> {
    return this.http
      .get<Clinic[]>(this.apiUrl)
      .pipe(tap((data) => console.log('Date primite în serviciu:', data)));
  }
}
