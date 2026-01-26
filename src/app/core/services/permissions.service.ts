import { Injectable, computed, inject } from '@angular/core';
import { SessionStore, Role as AppRole } from '../state/session.store';

export type Role = AppRole;

export type Permission =
  // Products
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.toggleActive'
  // Sales
  | 'sales.view'
  | 'sales.create'
  // Reports
  | 'reports.view'
  | 'reports.admin'
  // Users / Franchises
  | 'users.view'
  | 'users.create.partner'
  | 'users.create.franchise_owner'
  | 'users.create.seller'
  | 'users.edit'
  | 'franchises.view'
  | 'franchises.manage'
  // Chat
  | 'chat.view'
  | 'chat.admin';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private session = inject(SessionStore);

  role = computed<Role | null>(() => this.session.user()?.role ?? null);

  is(role: Role) {
    return this.role() === role;
  }

  isAny(...roles: Role[]) {
    const r = this.role();
    return !!r && roles.includes(r);
  }

  can(p: Permission): boolean {
    const role = this.role();
    if (!role) return false;

    // OWNER / PARTNER: todo
    if (role === 'OWNER' || role === 'PARTNER') return true;

    // FRANCHISE_OWNER: administra su franquicia
    if (role === 'FRANCHISE_OWNER') {
      return (
        p === 'products.view' ||
        p === 'products.create' ||
        p === 'products.edit' ||
        p === 'products.toggleActive' ||
        p === 'sales.view' ||
        p === 'sales.create' ||
        p === 'reports.view' ||
        p === 'users.view' ||
        p === 'users.create.seller' ||
        p === 'users.edit' ||
        p === 'chat.view'
      );
    }

    // SELLER: lectura + crear ventas (NO productos, NO users, NO franquicias, NO chat)
    if (role === 'SELLER') {
      return (
        p === 'products.view' ||
        p === 'sales.view' ||
        p === 'sales.create' ||
        p === 'reports.view'
      );
    }

    return false;
  }
}
