import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { SeoService } from '../../seo.service';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-clinic-auth',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './clinic-auth.component.html',
  styleUrl: './clinic-auth.component.css',
})
export class ClinicAuthComponent implements OnInit {
  tab: 'login' | 'register' = 'login';
  step: 'auth' | 'verify' | 'forgot' | 'reset' = 'auth';
  loading = false;
  error = '';
  private returnUrl = '/clinici/dashboard';

  loginEmail = '';
  loginPassword = '';
  loginShowPw = false;

  regName = '';
  regEmail = '';
  regPassword = '';
  regConfirm = '';
  regShowPw = false;

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

  private seo = inject(SeoService);
  private metaService = inject(Meta);

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.seo.set({
      title: 'Autentificare clinică | DentiPro',
      description: 'Intră în contul tău de clinică dentară pe DentiPro.',
      canonical: 'https://dentipro.ro/clinici/autentificare',
    });
    this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });

    // Citește query params: tab și returnUrl
    this.route.queryParams.subscribe((p) => {
      if (p['tab'] === 'register') this.tab = 'register';
      if (p['returnUrl']) this.returnUrl = p['returnUrl'];
    });
    if (this.authService.isAdmin) {
      this.router.navigate(['/administrator']);
    } else if (this.authService.isLoggedIn && this.authService.isClinic) {
      this.router.navigate([this.returnUrl]);
    }
    // Dacă e logat ca pacient, NU redirectăm — afișăm alert în pagină
  }

  switchTab(t: 'login' | 'register') {
    this.tab = t;
    this.error = '';
  }

  async submitLogin() {
    this.error = '';
    this.loading = true;
    const res = await this.authService.login(this.loginEmail, this.loginPassword);
    this.loading = false;
    if (res.requiresVerification) {
      this.pendingEmail = res.email ?? this.loginEmail;
      this.step = 'verify';
      return;
    }
    if (res.success) {
      if (this.authService.isAdmin) {
        this.router.navigate(['/administrator']);
      } else if (this.authService.isPatient) {
        // Pacient a încercat să se logheze prin portalul clinicilor
        this.authService.logout();
        this.error = 'Acesta este un cont de pacient. Folosiți autentificarea de pe site.';
      } else if (!this.authService.currentUser?.clinicId) {
        this.router.navigate(['/clinici/inscriere']);
      } else {
        this.router.navigate([this.returnUrl]);
      }
    } else {
      this.error = res.error ?? 'Eroare la autentificare.';
    }
  }

  async submitRegister() {
    this.error = '';
    this.loading = true;
    const res = await this.authService.registerClinic(
      this.regName, this.regEmail, this.regPassword, this.regConfirm,
    );
    this.loading = false;
    if (res.requiresVerification) {
      this.pendingEmail = res.email ?? this.regEmail;
      this.step = 'verify';
      return;
    }
    if (!res.success) {
      this.error = res.error ?? 'Eroare la înregistrare.';
    }
  }

  async submitVerify() {
    this.error = '';
    this.loading = true;
    const res = await this.authService.verifyEmail(this.pendingEmail, this.verifyCode.trim());
    this.loading = false;
    if (res.success) {
      if (this.authService.isAdmin) {
        this.router.navigate(['/administrator']);
      } else if (!this.authService.currentUser?.clinicId) {
        this.router.navigate(['/clinici/inscriere']);
      } else {
        this.router.navigate([this.returnUrl]);
      }
    } else {
      this.error = res.error ?? 'Cod incorect.';
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
    this.step = 'auth';
    this.verifyCode = '';
    this.error = '';
    this.resendSuccess = false;
    this.resendCooldown = 0;
    clearInterval(this.resendTimer);
  }

  get isPatientLoggedIn(): boolean {
    return this.authService.isLoggedIn && this.authService.isPatient;
  }

  logoutAndStay() {
    this.authService.logout();
  }

  goToForgot() {
    this.step = 'forgot';
    this.forgotEmail = this.loginEmail;
    this.error = '';
    this.resetSuccess = false;
  }

  async submitForgot() {
    this.error = '';
    this.loading = true;
    const res = await this.authService.forgotPassword(this.forgotEmail);
    this.loading = false;
    if (res.success) {
      this.step = 'reset';
    } else {
      this.error = res.error ?? 'Eroare. Încearcă din nou.';
    }
  }

  async submitReset() {
    this.error = '';
    if (this.resetNewPassword !== this.resetConfirm) {
      this.error = 'Parolele nu se potrivesc.';
      return;
    }
    this.loading = true;
    const res = await this.authService.resetPassword(this.forgotEmail, this.resetCode.trim(), this.resetNewPassword);
    this.loading = false;
    if (res.success) {
      this.resetSuccess = true;
      setTimeout(() => {
        this.step = 'auth';
        this.resetSuccess = false;
        this.resetCode = '';
        this.resetNewPassword = '';
        this.resetConfirm = '';
      }, 2000);
    } else {
      this.error = res.error ?? 'Eroare. Încearcă din nou.';
    }
  }
}
