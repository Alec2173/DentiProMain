import {
  Component,
  AfterViewInit,
  OnInit,
  signal,
  HostListener,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { HomeComponent } from './home/home.component';
import {
  Router,
  Event as RouterEvent,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import * as CookieConsent from 'vanilla-cookieconsent';
import { LeftSidebarComponent } from './left-sidebar/left-sidebar.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, LeftSidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  constructor(private router: Router) {
    this.router.events.subscribe((event: RouterEvent) => {
      if (
        event instanceof NavigationStart ||
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        window.scrollTo(0, 0);
      }
    });
  }

  ngAfterViewInit(): void {
    CookieConsent.run({
      categories: {
        necessary: {
          enabled: true, // this category is enabled by default
          readOnly: true, // this category cannot be disabled
        },
        analytics: {},
      },

      language: {
        default: 'en',
        translations: {
          en: {
            consentModal: {
              title: 'Folosim cookie-uri',
              description: '',
              acceptAllBtn: 'Accepta toate ',
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
                  description:
                    'Cookie-urile sunt fișiere text foarte mici ce sunt salvate în browser-ul tău atunci când vizitezi un website. Folosim cookie-uri pentru mai multe scopuri, dar și pentru a îți oferi cea mai bună experiență de utilizare posibilă (de exemplu, să reținem datele tale de logare în cont). Îți poți modifica preferințele și poți refuza ca anumite tipuri de cookie-uri să nu fie salvate în browser în timp ce navigezi pe website-ul nostru. Deasemenea poți șterge cookie-urile salvate deja în browser, dar reține că este posibil să nu poți folosi anumite părți ale website-ul nostru în acest caz.',
                },
                {
                  title: 'Cookie-uri strict necesare',
                  description:
                    'Aceste cookie-uri sunt esențiale pentru a putea beneficia de serviciile disponibile pe website-ul nostru. Fără aceste cookie-uri nu poți folosi anumite funcționalități ale website-ului nostru.',

                  //this field will generate a toggle linked to the 'necessary' category
                  linkedCategory: 'necessary',
                },
                {
                  title: 'Cookie-uri de analiza si performanta',
                  description:
                    'Acest tip de cookie-uri sunt folosite pentru a colecta informații în vederea analizării traficului pe website-ul nostru și modul în care vizitatorii noștri folosesc website-ul. De exemplu, aceste cookie-uri pot urmări cât timp petreci pe website sau paginile pe care le vizitezi, ceea ce ne ajută să înțelegem cum putem îmbunătăți website-ul pentru tine. Informațiile astfel colectate nu identifică individual vizitatorii.',
                  linkedCategory: 'analytics',
                },
              ],
            },
          },
        },
      },
    });
  }
  isLeftSidebarCollapsed = signal<boolean>(false);
  screenWidth = signal<number>(window.innerWidth);

  @HostListener('window:resize')
  onResize() {
    this.screenWidth.set(window.innerWidth);
    if (this.screenWidth() < 768) {
      this.isLeftSidebarCollapsed.set(true);
    }
  }

  ngOnInit(): void {
    this.isLeftSidebarCollapsed.set(this.screenWidth() < 768);
  }

  changeIsLeftSidebarCollapsed(isLeftSidebarCollapsed: boolean): void {
    this.isLeftSidebarCollapsed.set(isLeftSidebarCollapsed);
  }
}
