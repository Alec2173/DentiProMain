import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { ClinicDataService } from '../clinic-data.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  mobileMenuOpen = false;
  userMenuOpen = false;

  // ── SEARCH ────────────────────────────────────────────────
  searchQuery = '';
  searchResults: any[] = [];
  showSearchDrop = false;
  private allClinics: any[] = [];

  // ── AUTH MODAL (patients only) ────────────────────────────
  showModal = false;
  showWrongAccountAlert = false;
  modalTab: 'login' | 'register' = 'login';
  modalStep: 'auth' | 'verify' | 'forgot' | 'reset' = 'auth';
  modalLoading = false;
  modalError = '';

  loginEmail = '';
  loginPassword = '';
  loginShowPw = false;

  regName = '';
  regEmail = '';
  regPassword = '';
  regConfirm = '';

  // Verificare email
  pendingEmail = '';
  verifyCode = '';
  resendLoading = false;
  resendSuccess = false;
  resendCooldown = 0;
  private resendTimer: any;

  // Resetare parolă
  forgotEmail = '';
  resetCode = '';
  resetNewPassword = '';
  resetConfirm = '';
  resetShowPw = false;
  resetSuccess = false;

  constructor(
    public authService: AuthService,
    private clinicData: ClinicDataService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.clinicData.loadClinicsAuto().subscribe({
      next: (data) => { this.allClinics = data; },
    });
  }

  onSearchInput() {
    const q = this.searchQuery.trim().toLowerCase();
    if (q.length < 2) { this.searchResults = []; this.showSearchDrop = false; return; }

    this.searchResults = this.allClinics
      .filter(c => {
        const inName    = c.name?.toLowerCase().includes(q);
        const inCity    = c.city?.toLowerCase().includes(q);
        const inServices = Array.isArray(c.services)
          ? c.services.some((s: any) => s.label?.toLowerCase().includes(q))
          : (typeof c.services === 'string' && c.services.toLowerCase().includes(q));
        return inName || inCity || inServices;
      })
      .slice(0, 6)
      .map(c => ({
        ...c,
        images: Array.isArray(c.images) ? c.images : [],
        logo_url: c.logo_url || c.logo_path || null,
        servicePreview: Array.isArray(c.services)
          ? c.services.slice(0, 2).map((s: any) => s.label).join(', ')
          : '',
      }));

    this.showSearchDrop = this.searchResults.length > 0 || q.length >= 2;
  }

  goToClinic(id: number) {
    this.showSearchDrop = false;
    this.searchQuery = '';
    this.router.navigate(['/descripton', id]);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchDrop = false;
  }

  // ── MOBILE MENU ───────────────────────────────────────────
  toggleMobileMenu() { this.mobileMenuOpen = !this.mobileMenuOpen; }
  closeMobileMenu() { this.mobileMenuOpen = false; }

  // ── USER DROPDOWN ─────────────────────────────────────────
  toggleUserMenu() { this.userMenuOpen = !this.userMenuOpen; }

  logout() {
    this.authService.logout();
    this.userMenuOpen = false;
  }

  getInitials(): string {
    return (this.authService.currentUser?.name ?? '')
      .split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  // ── MODAL ─────────────────────────────────────────────────
  openModal(tab: 'login' | 'register') {
    if (this.authService.isClinic || this.authService.isAdmin) {
      this.showWrongAccountAlert = true;
      this.userMenuOpen = false;
      this.mobileMenuOpen = false;
      setTimeout(() => { this.showWrongAccountAlert = false; }, 4000);
      return;
    }
    this.modalTab = tab;
    this.showModal = true;
    this.modalError = '';
    this.userMenuOpen = false;
    this.mobileMenuOpen = false;
  }

  closeModal() {
    this.showModal = false;
    this.modalStep = 'auth';
    this.modalError = '';
    this.loginEmail = '';
    this.loginPassword = '';
    this.regName = '';
    this.regEmail = '';
    this.regPassword = '';
    this.regConfirm = '';
    this.verifyCode = '';
    this.pendingEmail = '';
    this.resendSuccess = false;
    this.resendCooldown = 0;
    clearInterval(this.resendTimer);
    this.forgotEmail = '';
    this.resetCode = '';
    this.resetNewPassword = '';
    this.resetConfirm = '';
    this.resetSuccess = false;
  }

  switchTab(tab: 'login' | 'register') {
    this.modalTab = tab;
    this.modalError = '';
  }

  async submitLogin() {
    this.modalError = '';
    this.modalLoading = true;
    const result = await this.authService.login(this.loginEmail, this.loginPassword);
    this.modalLoading = false;
    if (result.requiresVerification) {
      this.pendingEmail = result.email ?? this.loginEmail;
      this.modalStep = 'verify';
      return;
    }
    if (result.success) {
      if (!this.authService.isPatient) {
        this.authService.logout();
        this.modalError = 'Acest cont aparține unei clinici. Folosiți portalul clinicilor pentru autentificare.';
        return;
      }
      this.closeModal();
    } else {
      this.modalError = result.error ?? 'Eroare la autentificare.';
    }
  }

  async submitRegister() {
    this.modalError = '';
    this.modalLoading = true;
    const result = await this.authService.registerPatient(
      this.regName, this.regEmail, this.regPassword, this.regConfirm,
    );
    this.modalLoading = false;
    if (result.requiresVerification) {
      this.pendingEmail = result.email ?? this.regEmail;
      this.modalStep = 'verify';
      return;
    }
    if (!result.success) {
      this.modalError = result.error ?? 'Eroare la înregistrare.';
    }
  }

  async submitVerify() {
    this.modalError = '';
    this.modalLoading = true;
    const result = await this.authService.verifyEmail(this.pendingEmail, this.verifyCode.trim());
    this.modalLoading = false;
    if (result.success) {
      if (!this.authService.isPatient) {
        this.authService.logout();
        this.modalError = 'Acest cont aparține unei clinici.';
        this.modalStep = 'auth';
        return;
      }
      this.closeModal();
    } else {
      this.modalError = result.error ?? 'Cod incorect.';
    }
  }

  async resendCode() {
    if (this.resendCooldown > 0 || this.resendLoading) return;
    this.resendLoading = true;
    this.resendSuccess = false;
    await this.authService.resendVerification(this.pendingEmail);
    this.resendLoading = false;
    this.resendSuccess = true;
    this.resendCooldown = 60;
    this.resendTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(this.resendTimer);
    }, 1000);
  }

  backToAuth() {
    this.modalStep = 'auth';
    this.verifyCode = '';
    this.modalError = '';
    this.resendSuccess = false;
    this.resendCooldown = 0;
    clearInterval(this.resendTimer);
  }

  goToForgot() {
    this.modalStep = 'forgot';
    this.forgotEmail = this.loginEmail;
    this.modalError = '';
    this.resetSuccess = false;
  }

  async submitForgot() {
    this.modalError = '';
    this.modalLoading = true;
    const res = await this.authService.forgotPassword(this.forgotEmail);
    this.modalLoading = false;
    if (res.success) {
      this.modalStep = 'reset';
    } else {
      this.modalError = res.error ?? 'Eroare. Încearcă din nou.';
    }
  }

  async submitReset() {
    this.modalError = '';
    if (this.resetNewPassword !== this.resetConfirm) {
      this.modalError = 'Parolele nu se potrivesc.';
      return;
    }
    this.modalLoading = true;
    const res = await this.authService.resetPassword(this.forgotEmail, this.resetCode.trim(), this.resetNewPassword);
    this.modalLoading = false;
    if (res.success) {
      this.resetSuccess = true;
      setTimeout(() => {
        this.modalStep = 'auth';
        this.resetSuccess = false;
        this.resetCode = '';
        this.resetNewPassword = '';
        this.resetConfirm = '';
      }, 2000);
    } else {
      this.modalError = res.error ?? 'Eroare. Încearcă din nou.';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event) {
    const t = e.target as HTMLElement;
    if (!t.closest('.user-area')) this.userMenuOpen = false;
    if (!t.closest('.search-wrap')) this.showSearchDrop = false;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.showSearchDrop = false;
    this.userMenuOpen = false;
  }
}
