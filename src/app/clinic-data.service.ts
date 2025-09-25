import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { switchMap } from 'rxjs';

export interface Clinic {
  id: number;
  name: string;
  phone: string;
  email: string;
  services: string;
  city: string;
  logo_path: string;
  clinic_images: string[];
  client_phone: string;
  client_email: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClinicDataService {
  private apiUrl = 'https://www.dentipro.ro/api/clinics';

  constructor(private http: HttpClient) {}
  getToken() {
    this.http
      .post<{ token: string }>('https://www.dentipro.ro/api/login', {
        username: 'admin',
        password: 'parola123',
      })
      .subscribe({
        next: (res) => {
          localStorage.setItem('token', res.token); // Salvezi tokenul
          console.log('Token:', res.token);
        },
        error: (err) => {
          console.error('Eroare la login:', err);
        },
      });
  }
  getClinics(): Observable<Clinic[]> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('Token lipsa in localStorage');
    }
    return this.http
      .get<Clinic[]>(this.apiUrl, { headers })
      .pipe(tap((data) => console.log('Date primite în serviciu:', data)));
  }

  loadClinicsAuto(): Observable<Clinic[]> {
    return this.http
      .post<{ token: string }>('https://www.dentipro.ro/api/login', {
        username: 'Alec',
        password: '6IY7{|#J2jTA60c',
      })
      .pipe(
        tap((res) => localStorage.setItem('token', res.token)),
        switchMap(() => this.getClinics())
      );
  }
}
