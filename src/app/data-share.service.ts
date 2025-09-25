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
}
