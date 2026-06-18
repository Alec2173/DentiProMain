import {
  Component,
  AfterViewInit,
  OnInit,
  OnDestroy,
  signal,
  HostListener,
} from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { ClinicNavbarComponent } from './clinic-portal/clinic-navbar/clinic-navbar.component';
import { SupportWidgetComponent } from './support-widget/support-widget.component';
import { ToastComponent } from './toast/toast.component';
import { Router, Event as RouterEvent, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from './auth.service';
import { AnalyticsService } from './analytics.service';
import * as CookieConsent from 'vanilla-cookieconsent';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, NavbarComponent, ClinicNavbarComponent, SupportWidgetComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  isClinicPortal = false;
  isNavigating = signal<boolean>(false);
  readonly currentYear = new Date().getFullYear();

  isLeftSidebarCollapsed = signal<boolean>(false);
  screenWidth = signal<number>(window.innerWidth);

  private destroy$ = new Subject<void>();

  constructor(private router: Router, private auth: AuthService, private analytics: AnalyticsService) {
    this.analytics.init();

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event: RouterEvent) => {
      if (event instanceof NavigationStart) {
        this.isNavigating.set(true);
      }
      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.isNavigating.set(false);
      }
      if (event instanceof NavigationEnd) {
        // Scroll to top after new page content renders
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const url = event.urlAfterRedirects;
        const clinicRoutes = ['/clinici', '/preturi', '/pentru-clinici'];
        this.isClinicPortal = clinicRoutes.some(r => url.startsWith(r));
        this.analytics.page(url);
      }
    });

    // Identifică userul la fiecare schimbare de auth state
    this.auth.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.analytics.identify(String(user.id), {
          role: user.role,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        });
      } else {
        this.analytics.reset();
      }
    });
  }

  ngAfterViewInit(): void {
    CookieConsent.run({
      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: {},
      },
      language: {
        default: 'ro',
        translations: {
          ro: {
            consentModal: {
              title: '🍪 Folosim cookie-uri',
              description:
                'Folosim cookie-uri strict necesare pentru funcționarea platformei și, opțional, cookie-uri de analiză (Google Analytics) pentru a înțelege cum este utilizat site-ul. Poți alege ce accepți. <a href="/GDPR" class="cc-link">Politică confidențialitate</a> · <a href="/termeni" class="cc-link">Termeni și condiții</a>',
              acceptAllBtn: 'Acceptă toate',
              acceptNecessaryBtn: 'Doar necesare',
              showPreferencesBtn: 'Setări cookie-uri',
            },
            preferencesModal: {
              title: 'Preferințe cookie-uri',
              acceptAllBtn: 'Acceptă toate',
              acceptNecessaryBtn: 'Doar necesare',
              savePreferencesBtn: 'Salvează preferințele',
              closeIconLabel: 'Închide',
              sections: [
                {
                  title: 'Confidențialitatea ta contează',
                  description:
                    'Poți alege ce tipuri de cookie-uri accepți. Cookie-urile strict necesare nu pot fi dezactivate deoarece sunt esențiale pentru funcționarea platformei.',
                },
                {
                  title: 'Cookie-uri strict necesare',
                  description:
                    'Necesare pentru autentificare, sesiune și navigare. Nu stochează date personale în afara platformei.',
                  linkedCategory: 'necessary',
                },
                {
                  title: 'Cookie-uri de analiză (Google Analytics)',
                  description:
                    'Ne ajută să înțelegem cum este utilizat site-ul (număr vizitatori, pagini populare). Datele sunt anonimizate și procesate de Google LLC.',
                  linkedCategory: 'analytics',
                },
              ],
            },
          },
        },
      },
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.screenWidth.set(window.innerWidth);
    if (this.screenWidth() < 768) this.isLeftSidebarCollapsed.set(true);
  }

  ngOnInit(): void {
    this.isLeftSidebarCollapsed.set(this.screenWidth() < 768);
    // Validează sesiunea salvată cu serverul (în background, fără a bloca UI-ul)
    this.auth.verifySession();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeIsLeftSidebarCollapsed(val: boolean): void {
    this.isLeftSidebarCollapsed.set(val);
  }
}
