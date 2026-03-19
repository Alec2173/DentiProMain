import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-clinic-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './clinic-navbar.component.html',
  styleUrl: './clinic-navbar.component.css',
})
export class ClinicNavbarComponent {
  mobileMenuOpen = false;
  userMenuOpen = false;

  constructor(public authService: AuthService) {}

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.userMenuOpen = false;
  }

  getInitials(): string {
    return (this.authService.currentUser?.name ?? '')
      .split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event) {
    if (!(e.target as HTMLElement).closest('.cn-user-area')) {
      this.userMenuOpen = false;
    }
  }
}
