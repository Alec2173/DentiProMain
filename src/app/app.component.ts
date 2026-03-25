import {
  Component,
  AfterViewInit,
  OnInit,
  signal,
  HostListener,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { ClinicNavbarComponent } from './clinic-portal/clinic-navbar/clinic-navbar.component';
import { LeftSidebarComponent } from './left-sidebar/left-sidebar.component';
import { SupportWidgetComponent } from './support-widget/support-widget.component';
import { Router, Event as RouterEvent, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { AuthService } from './auth.service';
import * as CookieConsent from 'vanilla-cookieconsent';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, ClinicNavbarComponent, LeftSidebarComponent, SupportWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, AfterViewInit {
  isClinicPortal = false;

  isLeftSidebarCollapsed = signal<boolean>(false);
  screenWidth = signal<number>(window.innerWidth);

  constructor(private router: Router, private auth: AuthService) {
    this.router.events.subscribe((event: RouterEvent) => {
      if (
        event instanceof NavigationStart ||
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        window.scrollTo(0, 0);
      }
      if (event instanceof NavigationEnd) {
        this.isClinicPortal = event.urlAfterRedirects.startsWith('/clinici');
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

  changeIsLeftSidebarCollapsed(val: boolean): void {
    this.isLeftSidebarCollapsed.set(val);
  }
}
