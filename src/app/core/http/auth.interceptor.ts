import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStore } from '../state/session.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const token = session.accessToken(); // ✅ computed signal

  // ✅ NO poner token SOLO en login y refresh (pero SÍ en /auth/me)
  const isAuthLogin = req.url.includes('/auth/login');
  const isAuthRefresh = req.url.includes('/auth/refresh');

  if (isAuthLogin || isAuthRefresh) return next(req);

  if (!token) return next(req);

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};
