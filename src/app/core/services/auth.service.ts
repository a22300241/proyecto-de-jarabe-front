import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SessionStore, SessionTokens, SessionUser } from '../state/session.store';

type LoginResponse = {
  user: { id: string; name: string; role: any; franchiseId: string | null };
  accessToken: string;
  refreshToken: string;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  public session = inject(SessionStore);

  private baseUrl = 'http://localhost:3000';

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, { email, password })
    );

    const tokens: SessionTokens = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    };

    // ✅ Mapeo a tu SessionUser real (userId)
    const user: SessionUser = {
      userId: res.user.id,
      name: res.user.name,
      role: res.user.role,
      franchiseId: res.user.franchiseId ?? null,
    };

    this.session.setSession(user, tokens);
  }

  async refreshTokens(): Promise<void> {
    const user = this.session.user();       // ✅ Signal
    const tokens = this.session.tokens();   // ✅ Signal

    const refreshToken = tokens?.refreshToken;

    if (!user || !refreshToken) {
      this.logout();
      throw new Error('No session/refresh token');
    }

    const res = await firstValueFrom(
      this.http.post<RefreshResponse>(`${this.baseUrl}/auth/refresh`, { refreshToken })
    );

    const newTokens: SessionTokens = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    };

    this.session.setSession(user, newTokens);
  }

  logout(): void {
    this.session.clear();
  }
}
