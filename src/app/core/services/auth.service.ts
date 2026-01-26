import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { SessionStore, SessionUser } from '../state/session.store';
import { environment } from '../../../environments/environments';


type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private session = inject(SessionStore);

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => this.session.setSession(res)),
        map(() => void 0)
      );
  }

  refreshTokens(): Observable<void> {
    const rt = this.session.refreshToken();
    if (!rt) throw new Error('No refresh token');

    return this.http
      .post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken: rt })
      .pipe(
        tap((res) => this.session.patchTokens(res.accessToken, res.refreshToken)),
        map(() => void 0)
      );
  }

  logout() {
    this.session.logout();
  }
}
