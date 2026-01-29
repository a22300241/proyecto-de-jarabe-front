import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PermissionsService, Role } from '../services/permissions.service';
import { SessionStore } from '../state/session.store';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const session = inject(SessionStore);
  const perms = inject(PermissionsService);
  const router = inject(Router);

  // Si no hay sesión, al login (ruta real)
  if (!session.isLoggedIn()) {
    return router.parseUrl('/login');
  }

  const roles = (route.data?.['roles'] ?? null) as Role[] | null;

  if (!roles || roles.length === 0) return true;

  if (perms.isAny(...roles)) return true;

  // No logout, no login
  return router.parseUrl('/app/dashboard');
};
