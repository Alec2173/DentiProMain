import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth.service';

const API = '/api';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cta.component.html',
  styleUrl: './cta.component.css',
})
export class CtaComponent implements OnInit {
  public auth = inject(AuthService);
  private http = inject(HttpClient);

  clinic: any = null;
  profileCompletion = 0;
  hasImages = false;

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  ngOnInit() {
    if (this.auth.isClinic && this.auth.currentUser?.clinicId) {
      this.loadClinicPreview();
    }
  }

  loadClinicPreview() {
    const id = this.auth.currentUser?.clinicId;
    this.http.get<any>(`${API}/clinics/${id}`).subscribe({
      next: (c) => {
        this.clinic = c;
        this.hasImages = c.images?.length > 0;
        // Calcul progres profil
        let score = 0;
        if (c.name) score += 20;
        if (c.email) score += 10;
        if (c.phone_public) score += 15;
        if (c.city) score += 10;
        if (c.address) score += 10;
        if (c.images?.length > 0) score += 20;
        if (c.services?.length > 0) score += 15;
        this.profileCompletion = score;
      },
      error: () => {},
    });
  }

  get planLabel(): string {
    const p = this.clinic?.plan;
    if (p === 'pro') return '★ VIP Pro';
    if (p === 'growth') return 'Growth';
    return 'Starter';
  }

  get planColor(): string {
    const p = this.clinic?.plan;
    if (p === 'pro') return '#d4a52a';
    if (p === 'growth') return '#38bdf8';
    return '#94a3b8';
  }
}
