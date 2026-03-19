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
import { Router, Event as RouterEvent, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { AuthService } from './auth.service';
import * as CookieConsent from 'vanilla-cookieconsent';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, ClinicNavbarComponent, LeftSidebarComponent],
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
        default: 'en',
        translations: {
          en: {
            consentModal: {
              title: 'Folosim cookie-uri',
              description: '',
              acceptAllBtn: 'Accepta toate',
              acceptNecessaryBtn: 'Refuz',
              showPreferencesBtn: 'Vreau sa schimb setarile',
            },
            preferencesModal: {
              title: 'Preferințe pentru Cookie-uri',
              acceptAllBtn: 'Sunt de acord',
              acceptNecessaryBtn: 'Refuz',
              savePreferencesBtn: 'Salveaza setarile',
              closeIconLabel: 'Close modal',
              sections: [
                {
                  title: 'Confidențialitatea ta este importantă pentru noi',
                  description: 'Cookie-urile sunt fișiere text foarte mici ce sunt salvate în browser-ul tău atunci când vizitezi un website.',
                },
                {
                  title: 'Cookie-uri strict necesare',
                  description: 'Aceste cookie-uri sunt esențiale pentru a putea beneficia de serviciile disponibile pe website-ul nostru.',
                  linkedCategory: 'necessary',
                },
                {
                  title: 'Cookie-uri de analiza si performanta',
                  description: 'Folosite pentru a colecta informații despre traficul pe website-ul nostru.',
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
