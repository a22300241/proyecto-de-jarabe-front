import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStore } from '../state/session.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);

  // OJO: dependiendo tu store, puede ser session.accessToken() o session.token()
  const token =
    (session as any).accessToken?.() ??
    (session as any).token?.() ??
    (session as any).accessToken ??
    (session as any).token ??
    null;

  // Si NO hay token, manda la request normal
  if (!token) return next(req);

  // Agrega Authorization
  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq);
};


