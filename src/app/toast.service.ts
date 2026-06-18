import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  readonly toasts = this.toasts$.asObservable();

  show(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    const id = ++this.counter;
    const toast: Toast = { id, message, type };
    this.toasts$.next([...this.toasts$.value, toast]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
  }
}
