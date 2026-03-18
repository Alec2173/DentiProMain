import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home-nd/home-nd.component').then((m) => m.HomeNdComponent),
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./calendar/calendar.component').then((m) => m.CalendarComponent),
  },
  {
    path: 'Inscriere',
    loadComponent: () =>
      import('./form/form.component').then((m) => m.FormComponent),
  },
  {
    path: 'harta',
    loadComponent: () =>
      import('./map/map.component').then((m) => m.MapComponent),
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
    path: 'sidebar',
    loadComponent: () =>
      import('./left-sidebar/left-sidebar.component').then(
        (m) => m.LeftSidebarComponent,
      ),
  },
  {
    path: 'descripton/:id',
    loadComponent: () =>
      import('./descripton-page/descripton-page.component').then(
        (m) => m.DescriptonPageComponent,
      ),
  },
  {
    path: 'clinic-profile/:id',
    loadComponent: () =>
      import('./clinic-profile/clinic-profile.component').then(
        (m) => m.ClinicProfileComponent,
      ),
  },
  {
    path: 'finder',
    loadComponent: () =>
      import('./finder/finder.component').then((m) => m.FinderComponent),
  },
  {
    path: 'viewer',
    loadComponent: () =>
      import('./form/viewer/viewer.component').then((m) => m.ViewerComponent),
  },

  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
