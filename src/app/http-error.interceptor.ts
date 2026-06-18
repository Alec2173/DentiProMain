import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError, catchError } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

/** Rute API unde erorile sunt gestionate explicit în componentă — nu afișăm toast global */
const SILENT_PATTERNS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/feedback/',
  '/feed/',           // erorile de feed sunt afișate inline
  '/support/message',
  '/reviews/clinic/',  // profilul public — componenta gestionează inline
  '/messages',         // mesajele de la pacienți — gestionate inline
];

function isSilent(url: string): boolean {
  return SILENT_PATTERNS.some(p => url.includes(p));
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router  = inject(Router);
  const auth    = inject(AuthService);
  const toast   = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        // Token expirat sau invalid — delogare silențioasă
        auth.logout();
        const onClinicSide = router.url.startsWith('/clinici');
        router.navigate([onClinicSide ? '/clinici/autentificare' : '/']);
        return throwError(() => err);
      }

      if (err.status === 403 && req.url.includes('dentipro.ro/api')) {
        toast.show('Nu ai permisiunea pentru această acțiune.', 'error');
        return throwError(() => err);
      }

      if (isSilent(req.url)) {
        return throwError(() => err);
      }

      if (err.status === 0 || err.status >= 500) {
        toast.show('Eroare de server. Încearcă din nou în câteva momente.', 'error');
      } else if (err.status === 404) {
        // 404 — nu afișăm toast global, componenta gestionează
      } else if (err.status >= 400) {
        const msg = err.error?.error || err.error?.message;
        if (msg) toast.show(msg, 'error');
      }

      return throwError(() => err);
    }),
  );
};
