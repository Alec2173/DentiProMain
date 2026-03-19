import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataShareService {
  private citySubject = new BehaviorSubject<string>('');
  city$ = this.citySubject.asObservable();
  setCity(city: string) { this.citySubject.next(city ?? ''); }

  private serviceSubject = new BehaviorSubject<string>('');
  service$ = this.serviceSubject.asObservable();
  setService(service: string) { this.serviceSubject.next(service ?? ''); }

  private filtersSubject = new BehaviorSubject<any>(null);
  filters$ = this.filtersSubject.asObservable();
  setFilters(filters: any) { this.filtersSubject.next(filters); }
}
