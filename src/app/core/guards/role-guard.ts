import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { SessionStore, Role } from '../state/session.store';

export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  const allowed = (route.data['roles'] as Role[] | undefined) ?? [];
  const current = session.user()?.role ?? null;

  if (!current) {
    router.navigateByUrl('/login');
    return false;
  }

  if (allowed.length === 0) return true;

  if (allowed.includes(current)) return true;

  router.navigateByUrl('/app');
  return false;
};
