import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  mobileMenuOpen = false;
  userMenuOpen = false;

  // ── AUTH MODAL ────────────────────────────────
  showModal = false;
  modalTab: 'login' | 'register' = 'login';
  modalLoading = false;
  modalError = '';

  loginEmail = '';
  loginPassword = '';
  loginShowPw = false;

  regName = '';
  regEmail = '';
  regPassword = '';
  regConfirm = '';
  regShowPw = false;

  constructor(public authService: AuthService) {}

  // ── MOBILE MENU ───────────────────────────────
  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  // ── USER DROPDOWN ─────────────────────────────
  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.userMenuOpen = false;
  }

  getInitials(): string {
    const name = this.authService.currentUser?.name ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  // ── MODAL ─────────────────────────────────────
  openModal(tab: 'login' | 'register') {
    this.modalTab = tab;
    this.showModal = true;
    this.modalError = '';
    this.userMenuOpen = false;
    this.mobileMenuOpen = false;
  }

  closeModal() {
    this.showModal = false;
    this.modalError = '';
    this.loginEmail = '';
    this.loginPassword = '';
    this.regName = '';
    this.regEmail = '';
    this.regPassword = '';
    this.regConfirm = '';
  }

  switchTab(tab: 'login' | 'register') {
    this.modalTab = tab;
    this.modalError = '';
  }

  submitLogin() {
    this.modalError = '';
    this.modalLoading = true;
    setTimeout(() => {
      const result = this.authService.login(this.loginEmail, this.loginPassword);
      this.modalLoading = false;
      if (result.success) {
        this.closeModal();
      } else {
        this.modalError = result.error ?? 'Eroare la autentificare.';
      }
    }, 600);
  }

  submitRegister() {
    this.modalError = '';
    this.modalLoading = true;
    setTimeout(() => {
      const result = this.authService.register(
        this.regName,
        this.regEmail,
        this.regPassword,
        this.regConfirm,
      );
      this.modalLoading = false;
      if (result.success) {
        this.closeModal();
      } else {
        this.modalError = result.error ?? 'Eroare la înregistrare.';
      }
    }, 600);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.closest('.user-area')) {
      this.userMenuOpen = false;
    }
  }
}
