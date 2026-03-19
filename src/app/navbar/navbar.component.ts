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

  async submitLogin() {
    this.modalError = '';
    this.modalLoading = true;
    const result = await this.authService.login(this.loginEmail, this.loginPassword);
    this.modalLoading = false;
    if (result.success) {
      if (!this.authService.isPatient) {
        // Clinic or admin account — not allowed on patient site
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
    // Patient-only registration from the main site
    const result = await this.authService.registerPatient(
      this.regName, this.regEmail, this.regPassword, this.regConfirm,
    );
    this.modalLoading = false;
    if (result.success) {
      this.closeModal();
    } else {
      this.modalError = result.error ?? 'Eroare la înregistrare.';
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
