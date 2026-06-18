import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);
  private maptilerKey = '';
  private googleMapsKey = '';
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = firstValueFrom(
      this.http.get<{ maptilerKey: string; googleMapsKey: string }>(`${API}/config/maps`)
    ).then(cfg => {
      this.maptilerKey = cfg.maptilerKey;
      this.googleMapsKey = cfg.googleMapsKey;
      this.injectGoogleMaps(cfg.googleMapsKey);
    }).catch(() => {
      // fallback — pagina va funcționa fără hartă
    });
    return this.loadPromise;
  }

  getMaptilerKey(): string { return this.maptilerKey; }

  private injectGoogleMaps(key: string) {
    if (!key) return;
    if (document.querySelector('script[data-gmaps]')) return;
    const script = document.createElement('script');
    script.setAttribute('data-gmaps', 'true');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    document.head.appendChild(script);
  }
}
