import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let refreshing = false;

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // ✅ Solo refrescar en 401 (NO en 403)
      if (err.status !== 401) return throwError(() => err);

      // ✅ Evitar bucles
      if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
        return throwError(() => err);
      }

      // ✅ Evitar doble refresh simultáneo
      if (refreshing) return throwError(() => err);

      refreshing = true;

      return from(auth.refreshTokens()).pipe(
        switchMap(() => {
          refreshing = false;
          // ✅ Reintenta la request (auth.interceptor pondrá el token)
          return next(req);
        }),
        catchError((e) => {
          refreshing = false;
          auth.logout();
          return throwError(() => e);
        })
      );
    })
  );
};
