import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { SessionStore } from '../state/session.store';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const session = inject(SessionStore);

  // No tocar login/refresh
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: any) => {
      // Si no es error HTTP, propagar
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      // ✅ 403: NO refrescar, NO logout. Solo propaga error
      if (err.status === 403) {
        return throwError(() => err);
      }

      // ✅ Solo refrescar con 401
      if (err.status !== 401) {
        return throwError(() => err);
      }

      // Si no hay sesión, no intentes refresh
      if (!session.isLoggedIn()) {
        return throwError(() => err);
      }

      // ✅ intentar refresh 1 vez y reintentar request original
      return from(auth.refreshTokens()).pipe(
        switchMap(() => next(req)),
        catchError((refreshErr) => {
          // ✅ NO logout automático (esto era lo que te “sacaba”)
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
