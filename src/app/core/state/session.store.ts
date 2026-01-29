
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
const LS_ACTIVE_FRANCHISE_KEY = 'posjarabe.session.activeFranchiseId';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private _user = signal<SessionUser | null>(null);
  private _tokens = signal<SessionTokens | null>(null);

  // ✅ Franquicia activa elegida por OWNER/PARTNER
  private _activeFranchiseId = signal<string | null>(null);

  // ✅ Signals (se leen como función)
  user = computed(() => this._user());
  tokens = computed(() => this._tokens());

  accessToken = computed(() => this._tokens()?.accessToken ?? null);
  refreshToken = computed(() => this._tokens()?.refreshToken ?? null);

  isLoggedIn = computed(() => !!this._user() && !!this._tokens()?.accessToken);

  // ✅ Signal para franquicia activa
  activeFranchiseId = computed(() => this._activeFranchiseId());

  constructor() {
    this.hydrateFromStorage();
  }

  setSession(user: SessionUser, tokens: SessionTokens) {
    this._user.set(user);
    this._tokens.set(tokens);

    // Si es FRANCHISE_OWNER/SELLER, su franquicia es fija
    if (user.role === 'FRANCHISE_OWNER' || user.role === 'SELLER') {
      this._activeFranchiseId.set(user.franchiseId ?? null);
    }

    this.persistToStorage();
  }

  patchTokens(tokens: SessionTokens) {
    this._tokens.set(tokens);
    this.persistToStorage();
  }

  // ✅ Setter franquicia activa (OWNER/PARTNER)
  setActiveFranchiseId(franchiseId: string | null) {
    this._activeFranchiseId.set(franchiseId);
    this.persistToStorage();
  }

  clear() {
    this._user.set(null);
    this._tokens.set(null);
    this._activeFranchiseId.set(null);
    this.clearStorage();
  }

  // =========================
  // Storage helpers
  // =========================
  private hydrateFromStorage() {
    try {
      const rawUser = localStorage.getItem(LS_USER_KEY);
      const rawTokens = localStorage.getItem(LS_TOKENS_KEY);
      const rawActive = localStorage.getItem(LS_ACTIVE_FRANCHISE_KEY);

      if (rawUser && rawTokens) {
        const user = JSON.parse(rawUser) as SessionUser;
        const tokens = JSON.parse(rawTokens) as SessionTokens;

        if (user?.userId && tokens?.accessToken && tokens?.refreshToken) {
          this._user.set(user);
          this._tokens.set(tokens);
        }
      }

      if (rawActive) {
        this._activeFranchiseId.set(rawActive);
      } else {
        // si es user con franquicia fija, úsala
        const u = this._user();
        if (u && (u.role === 'FRANCHISE_OWNER' || u.role === 'SELLER')) {
          this._activeFranchiseId.set(u.franchiseId ?? null);
        }
      }
    } catch {
      this.clearStorage();
    }
  }

  private persistToStorage() {
    try {
      const u = this._user();
      const t = this._tokens();
      const f = this._activeFranchiseId();

      if (u && t) {
        localStorage.setItem(LS_USER_KEY, JSON.stringify(u));
        localStorage.setItem(LS_TOKENS_KEY, JSON.stringify(t));
      }

      if (f) localStorage.setItem(LS_ACTIVE_FRANCHISE_KEY, f);
      else localStorage.removeItem(LS_ACTIVE_FRANCHISE_KEY);
    } catch {}
  }

  private clearStorage() {
    try {
      localStorage.removeItem(LS_USER_KEY);
      localStorage.removeItem(LS_TOKENS_KEY);
      localStorage.removeItem(LS_ACTIVE_FRANCHISE_KEY);
    } catch {}
  }
}
