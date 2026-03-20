import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';

// HIDDEN_PRICING — de readus când lansăm
// Data ascuns: 2026-03-20
// Cum se dezactivează: șterge canActivate din rutele /clinici/pricing și /pricing din app.routes.ts
export const pricingGuard: CanActivateFn = () => {
  const router = inject(Router);
  return new RedirectCommand(router.parseUrl('/'));
};
