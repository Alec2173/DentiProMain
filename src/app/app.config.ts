import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import laraDark from '@primeng/themes/lara'; // import tema laraDark corect
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { ConfigService } from './config.service';
import { httpErrorInterceptor } from './http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideAnimations(),
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    { provide: APP_INITIALIZER, useFactory: (cfg: ConfigService) => () => cfg.load(), deps: [ConfigService], multi: true },
    providePrimeNG({
      theme: {
        preset: laraDark,
        options: {
          prefix: 'p',
          darkModeSelector: false,
          cssLayer: false,
        },
      },
      ripple: true, // activează ripple dacă vrei
    }),
  ],
};
