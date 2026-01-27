import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../state/session.store';

export const AuthGuard: CanActivateFn = () => {
  const session = inject(SessionStore);
  const router = inject(Router);

  // ✅ si tu store es signal: user()
  const isLogged = !!session.user();

  if (!isLogged) {
    router.navigateByUrl('/login');
    return false;
  }

  return true;
};
