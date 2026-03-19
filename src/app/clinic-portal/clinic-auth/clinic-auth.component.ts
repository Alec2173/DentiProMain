import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-clinic-auth',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './clinic-auth.component.html',
  styleUrl: './clinic-auth.component.css',
})
export class ClinicAuthComponent implements OnInit {
  tab: 'login' | 'register' = 'login';
  loading = false;
  error = '';

  loginEmail = '';
  loginPassword = '';
  loginShowPw = false;

  regName = '';
  regEmail = '';
  regPassword = '';
  regConfirm = '';
  regShowPw = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    // Support ?tab=register query param
    this.route.queryParams.subscribe((p) => {
      if (p['tab'] === 'register') this.tab = 'register';
    });
    if (this.authService.isAdmin) {
      this.router.navigate(['/administrator']);
    } else if (this.authService.isLoggedIn && this.authService.isClinic) {
      this.router.navigate(['/clinici/dashboard']);
    }
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
    if (res.success) {
      if (this.authService.isAdmin) {
        this.router.navigate(['/administrator']);
      } else {
        this.router.navigate(['/clinici/dashboard']);
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
    if (res.success) {
      this.router.navigate(['/clinici/inscriere']);
    } else {
      this.error = res.error ?? 'Eroare la înregistrare.';
    }
  }
}
