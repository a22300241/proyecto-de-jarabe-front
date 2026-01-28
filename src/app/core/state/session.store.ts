import { computed, Injectable, signal } from '@angular/core';

export type Role = 'OWNER' | 'PARTNER' | 'FRANCHISE_OWNER' | 'SELLER';

export interface SessionUser {
  userId: string;
  name: string;
  role: Role;
  franchiseId: string | null; // null o 'GLOBAL' para owner/partner
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

const LS_USER_KEY = 'posjarabe.session.user';
const LS_TOKENS_KEY = 'posjarabe.session.tokens';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private _user = signal<SessionUser | null>(null);
  private _tokens = signal<SessionTokens | null>(null);

  // ✅ Signals (se leen como función)
  user = computed(() => this._user());
  tokens = computed(() => this._tokens());

  accessToken = computed(() => this._tokens()?.accessToken ?? null);
  refreshToken = computed(() => this._tokens()?.refreshToken ?? null);

  isLoggedIn = computed(() => !!this._user() && !!this._tokens()?.accessToken);

  constructor() {
    this.hydrateFromStorage();
  }

  setSession(user: SessionUser, tokens: SessionTokens) {
    this._user.set(user);
    this._tokens.set(tokens);
    this.persistToStorage();
  }

  patchTokens(tokens: SessionTokens) {
    this._tokens.set(tokens);
    this.persistToStorage();
  }

  clear() {
    this._user.set(null);
    this._tokens.set(null);
    this.clearStorage();
  }

  // =========================
  // Storage helpers
  // =========================
  private hydrateFromStorage() {
    try {
      const rawUser = localStorage.getItem(LS_USER_KEY);
      const rawTokens = localStorage.getItem(LS_TOKENS_KEY);

      if (!rawUser || !rawTokens) return;

      const user = JSON.parse(rawUser) as SessionUser;
      const tokens = JSON.parse(rawTokens) as SessionTokens;

      // Validación mínima
      if (!user?.userId || !tokens?.accessToken || !tokens?.refreshToken) return;

      this._user.set(user);
      this._tokens.set(tokens);
    } catch {
      // Si algo está corrupto, limpiamos
      this.clearStorage();
    }
  }

  private persistToStorage() {
    try {
      const u = this._user();
      const t = this._tokens();

      if (!u || !t) return;

      localStorage.setItem(LS_USER_KEY, JSON.stringify(u));
      localStorage.setItem(LS_TOKENS_KEY, JSON.stringify(t));
    } catch {
      // si localStorage falla, no reventamos
    }
  }

  private clearStorage() {
    try {
      localStorage.removeItem(LS_USER_KEY);
      localStorage.removeItem(LS_TOKENS_KEY);
    } catch {}
  }
}
