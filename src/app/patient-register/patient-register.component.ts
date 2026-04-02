import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { SeoService } from '../seo.service';

@Component({
  selector: 'app-patient-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './patient-register.component.html',
  styleUrl: './patient-register.component.css',
})
export class PatientRegisterComponent implements OnInit {
  private seo = inject(SeoService);

  step: 'register' | 'verify' = 'register';

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPw = false;
  loading = false;
  error = '';

  verifyCode = '';
  pendingEmail = '';
  resendLoading = false;
  resendSuccess = false;
  resendCooldown = 0;
  private resendTimer: any;

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.auth.isLoggedIn && this.auth.isPatient) {
      this.router.navigate(['/finder']);
      return;
    }
    this.seo.set({
      title: 'Înregistrare pacient | DentiPro',
      description: 'Creează-ți un cont gratuit pe DentiPro. Caută clinici dentare, fă programări online, postează cereri de tratament și lasă recenzii.',
      canonical: 'https://dentipro.ro/inregistrare',
    });
  }

  async submitRegister() {
    this.error = '';
    if (!this.name.trim() || !this.email.trim() || !this.password) {
      this.error = 'Completează toate câmpurile.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Parolele nu se potrivesc.';
      return;
    }
    this.loading = true;
    const result = await this.auth.registerPatient(this.name, this.email, this.password, this.confirmPassword);
    this.loading = false;
    if (result.requiresVerification) {
      this.pendingEmail = result.email ?? this.email;
      this.step = 'verify';
    } else if (!result.success) {
      this.error = result.error ?? 'Eroare la înregistrare.';
    }
  }

  async submitVerify() {
    this.error = '';
    this.loading = true;
    const result = await this.auth.verifyEmail(this.pendingEmail, this.verifyCode.trim());
    this.loading = false;
    if (result.success) {
      this.router.navigate(['/finder']);
    } else {
      this.error = result.error ?? 'Cod incorect.';
    }
  }

  async resendCode() {
    if (this.resendCooldown > 0 || this.resendLoading) return;
    this.resendLoading = true;
    this.resendSuccess = false;
    await this.auth.resendVerification(this.pendingEmail);
    this.resendLoading = false;
    this.resendSuccess = true;
    this.resendCooldown = 60;
    this.resendTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(this.resendTimer);
    }, 1000);
  }
}
