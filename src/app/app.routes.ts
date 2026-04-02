import { Routes } from '@angular/router';

export const routes: Routes = [
  // ── PATIENT SITE ──────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./home-nd/home-nd.component').then((m) => m.HomeNdComponent),
  },
  {
    path: 'finder',
    loadComponent: () => import('./finder/finder.component').then((m) => m.FinderComponent),
  },
  {
    path: 'clinic-profile/:id',
    loadComponent: () => import('./clinic-profile/clinic-profile.component').then((m) => m.ClinicProfileComponent),
  },
  {
    path: 'descripton/:id',
    loadComponent: () => import('./descripton-page/descripton-page.component').then((m) => m.DescriptonPageComponent),
  },
  {
    path: 'harta',
    loadComponent: () => import('./map/map.component').then((m) => m.MapComponent),
  },
  {
    path: 'GDPR',
    loadComponent: () => import('./gdpr/gdpr.component').then((m) => m.GDPRComponent),
  },
  {
    path: 'termeni',
    loadComponent: () => import('./termeni/termeni.component').then((m) => m.TermeniComponent),
  },
  {
    path: 'calendar',
    loadComponent: () => import('./calendar/calendar.component').then((m) => m.CalendarComponent),
  },

  // ── CLINIC PORTAL ─────────────────────────────────────────
  {
    path: 'clinici',
    loadComponent: () =>
      import('./clinic-portal/clinic-landing/clinic-landing.component').then((m) => m.ClinicLandingComponent),
  },
  {
    path: 'clinici/autentificare',
    loadComponent: () =>
      import('./clinic-portal/clinic-auth/clinic-auth.component').then((m) => m.ClinicAuthComponent),
  },
  {
    path: 'clinici/inscriere',
    loadComponent: () => import('./form/form.component').then((m) => m.FormComponent),
  },
  {
    path: 'clinici/pricing',
    loadComponent: () => import('./pricing/pricing.component').then((m) => m.PricingComponent),
  },
  {
    path: 'clinici/dashboard',
    loadComponent: () =>
      import('./clinic-dashboard/clinic-dashboard.component').then((m) => m.ClinicDashboardComponent),
  },
  {
    path: 'clinici/profil',
    loadComponent: () => import('./clinic-profile/clinic-profile.component').then((m) => m.ClinicProfileComponent),
  },

  // ── LEGACY REDIRECTS ──────────────────────────────────────
  { path: 'Inscriere', redirectTo: 'clinici/inscriere', pathMatch: 'full' },
  { path: 'pricing', redirectTo: 'preturi', pathMatch: 'full' },
  {
    path: 'viewer',
    loadComponent: () => import('./form/viewer/viewer.component').then((m) => m.ViewerComponent),
  },
  {
    path: 'sidebar',
    loadComponent: () => import('./left-sidebar/left-sidebar.component').then((m) => m.LeftSidebarComponent),
  },

  {
    path: 'administrator',
    loadComponent: () => import('./admin/admin.component').then((m) => m.AdminComponent),
  },
  {
    path: 'favorites',
    loadComponent: () => import('./favorites/favorites.component').then(m => m.FavoritesComponent),
  },
  {
    path: 'appointments',
    loadComponent: () => import('./appointments/appointments.component').then(m => m.AppointmentsComponent),
  },
  {
    path: 'feed',
    loadComponent: () => import('./feed/feed.component').then(m => m.FeedComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'services',
    loadComponent: () => import('./services-page/services-page.component').then(m => m.ServicesPageComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./contact/contact.component').then((m) => m.ContactComponent),
  },

  {
    path: 'inregistrare',
    loadComponent: () => import('./patient-register/patient-register.component').then((m) => m.PatientRegisterComponent),
  },

  // ── SEO ROUTES ─────────────────────────────────────────────
  {
    path: 'dentisti/:serviciu',
    loadComponent: () => import('./clinic-list/clinic-list.component').then((m) => m.ClinicListComponent),
  },
  {
    path: 'dentisti/:serviciu/:oras',
    loadComponent: () => import('./clinic-list/clinic-list.component').then((m) => m.ClinicListComponent),
  },
  {
    path: 'preturi',
    loadComponent: () => import('./preturi/preturi.component').then((m) => m.PreturiComponent),
  },
  {
    path: 'pentru-clinici',
    loadComponent: () => import('./pentru-clinici/pentru-clinici.component').then((m) => m.PentruCliniciComponent),
  },

  {
    path: '**',
    loadComponent: () => import('./not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
