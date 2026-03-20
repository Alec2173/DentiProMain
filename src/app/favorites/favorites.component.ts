import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FavoritesService } from '../favorites.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css',
})
export class FavoritesComponent implements OnInit {
  clinics: any[] = [];
  isLoading = true;

  constructor(private favService: FavoritesService, public auth: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.auth.isClinic || this.auth.isAdmin) { this.router.navigate(['/clinici/dashboard']); return; }
    if (!this.auth.isLoggedIn) { this.isLoading = false; return; }
    this.favService.getFavorites().subscribe({
      next: (data) => { this.clinics = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  remove(clinicId: number) {
    this.favService.toggle(clinicId);
    this.clinics = this.clinics.filter(c => c.id !== clinicId);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
