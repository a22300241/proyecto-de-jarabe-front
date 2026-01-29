import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStore } from '../state/session.store';

export const franchiseInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const user = session.user();

  // no tocar login/refresh
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  if (!user) return next(req);

  // ✅ franquicia efectiva para requests
  const franchiseId =
    user.role === 'OWNER' || user.role === 'PARTNER'
      ? session.activeFranchiseId() ?? null
      : user.franchiseId ?? null;

  if (!franchiseId) return next(req);

  // ✅ manda header para que backend filtre
  return next(
    req.clone({
      setHeaders: { 'x-franchise-id': franchiseId },
    })
  );
};
