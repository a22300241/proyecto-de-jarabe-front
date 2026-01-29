import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStore } from '../state/session.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);

  // No tocar login/refresh
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  // ✅ toma token del store
  const tokenFromStore = session.accessToken?.() ?? null;

  // ✅ fallback por si algo no lo cargó (esto evita pantallas “sin token”)
  const tokenFromLS =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('pos_accessToken') ||
    null;

  const token = tokenFromStore || tokenFromLS;

  if (!token) return next(req);

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};
