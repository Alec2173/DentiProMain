import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'calendar',
    loadComponent: () =>
      import('./calendar/calendar.component').then((m) => m.CalendarComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },

  {
    path: 'Inscriere',
    loadComponent: () =>
      import('./form/form.component').then((m) => m.FormComponent),
  },
  {
    path: 'clinici',
    loadComponent: () =>
      import('./clinici/clinici.component').then((m) => m.CliniciComponent),
  },
  {
    path: 'GDPR',
    loadComponent: () =>
      import('./gdpr/gdpr.component').then((m) => m.GDPRComponent),
  },

  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
