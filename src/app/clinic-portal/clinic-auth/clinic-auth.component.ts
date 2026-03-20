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

  private seo = inject(SeoService);
  private metaService = inject(Meta);

  constructor(
    private authService: AuthService,
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
    if (res.success) {
      this.router.navigate([this.returnUrl]);
    } else {
      this.error = res.error ?? 'Eroare la înregistrare.';
    }
  }
}
