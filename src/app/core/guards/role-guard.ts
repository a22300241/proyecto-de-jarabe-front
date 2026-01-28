import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PermissionsService, Role } from '../services/permissions.service';
import { SessionStore } from '../state/session.store';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const session = inject(SessionStore);
  const perms = inject(PermissionsService);
  const router = inject(Router);

  // Si no hay sesión, al login
  if (!session.isLoggedIn()) {
    return router.parseUrl('/auth/login');
  }

  // Roles permitidos declarados en data: { roles: ['OWNER', ...] }
  const roles = (route.data?.['roles'] ?? null) as Role[] | null;

  // Si no se declararon roles, dejamos pasar (no rompemos rutas)
  if (!roles || roles.length === 0) return true;

  // Si cumple rol, pasa
  if (perms.isAny(...roles)) return true;

  // Si NO cumple rol: NO logout, NO login. Solo lo mando al shell.
  return router.parseUrl('/app');
};
