import { Injectable, signal } from '@angular/core';

export type Role = 'OWNER' | 'PARTNER' | 'FRANCHISE_OWNER' | 'SELLER';

export interface SessionUser {
  userId: string;
  name: string;
  role: Role;
  franchiseId: string | null; // null para OWNER/PARTNER global
}

const LS_USER = 'pos.session.user';
const LS_ACCESS = 'pos.session.accessToken';
const LS_REFRESH = 'pos.session.refreshToken';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  // Signals
  user = signal<SessionUser | null>(null);
  accessToken = signal<string | null>(null);
  refreshToken = signal<string | null>(null);

  constructor() {
    // Hydrate desde localStorage
    try {
      const u = localStorage.getItem(LS_USER);
      const a = localStorage.getItem(LS_ACCESS);
      const r = localStorage.getItem(LS_REFRESH);

      if (u) this.user.set(JSON.parse(u));
      if (a) this.accessToken.set(a);
      if (r) this.refreshToken.set(r);
    } catch {
      this.clear();
    }
  }

  isLoggedIn(): boolean {
    return !!this.accessToken();
  }

  setSession(payload: { user: SessionUser; accessToken: string; refreshToken: string }) {
    this.user.set(payload.user);
    this.accessToken.set(payload.accessToken);
    this.refreshToken.set(payload.refreshToken);

    localStorage.setItem(LS_USER, JSON.stringify(payload.user));
    localStorage.setItem(LS_ACCESS, payload.accessToken);
    localStorage.setItem(LS_REFRESH, payload.refreshToken);
  }

  patchTokens(accessToken: string, refreshToken: string) {
    this.accessToken.set(accessToken);
    this.refreshToken.set(refreshToken);
    localStorage.setItem(LS_ACCESS, accessToken);
    localStorage.setItem(LS_REFRESH, refreshToken);
  }

  clear() {
    this.user.set(null);
    this.accessToken.set(null);
    this.refreshToken.set(null);
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_ACCESS);
    localStorage.removeItem(LS_REFRESH);
  }

  logout() {
    this.clear();
  }
}
