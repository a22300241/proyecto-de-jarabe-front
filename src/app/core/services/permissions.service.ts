import { Injectable, computed, inject } from '@angular/core';
import { SessionStore } from '../state/session.store';

export type Role = 'OWNER' | 'PARTNER' | 'FRANCHISE_OWNER' | 'SELLER';

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

  // ✅ OJO: si tu SessionStore usa signals (user()), aquí lo llamamos:
  role = computed(() => (this.session.user()?.role ?? null) as Role | null);

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

    // FRANCHISE_OWNER: administra SU franquicia
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

    // SELLER: lectura + crear ventas + chat (SIN reportes)
    if (role === 'SELLER') {
      return (
        p === 'products.view' ||
        p === 'sales.view' ||
        p === 'sales.create' ||
        p === 'chat.view'
      );
    }

    return false;
  }
}
