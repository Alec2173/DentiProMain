import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataShareService {
  private citySubject = new BehaviorSubject<any>(null); // sau <string> dacă e doar un string

  city$ = this.citySubject.asObservable();

  setCity(city: any) {
    this.citySubject.next(city);
  }

  private filtersSubject = new BehaviorSubject<any>(null);
  filters$ = this.filtersSubject.asObservable();

  setFilters(filters: any) {
    this.filtersSubject.next(filters);
  }
}
