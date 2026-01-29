import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environments';

export type Role = 'OWNER' | 'PARTNER' | 'FRANCHISE_OWNER' | 'SELLER';

export type UserDto = {
  id: string;
  email: string;
  name: string;
  role: Role;
  franchiseId: string | null;
  createdAt: string;
  isActive: boolean;
};

export type CreateUserBody = {
  email: string;
  password: string;
  name: string;
  role: Role;
  franchiseId?: string; // SOLO cuando role=SELLER o FRANCHISE_OWNER
};

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  // GET /users?franchiseId=...
  async list(franchiseId?: string): Promise<UserDto[]> {
    let params = new HttpParams();
    if (franchiseId) params = params.set('franchiseId', franchiseId);

    const url = `${environment.apiUrl}/users`;
    return firstValueFrom(this.http.get<UserDto[]>(url, { params }));
  }

  // POST /users
  async createUser(body: CreateUserBody) {
    const url = `${environment.apiUrl}/users`;
    return firstValueFrom(this.http.post(url, body));
  }

  // PATCH /users/:id/deactivate
  async deactivate(userId: string): Promise<{ ok: true; userId: string; isActive: boolean }> {
    const url = `${environment.apiUrl}/users/${userId}/deactivate`;
    return firstValueFrom(this.http.patch<{ ok: true; userId: string; isActive: boolean }>(url, {}));
  }

  // PATCH /users/:id/activate
  async activate(userId: string): Promise<{ ok: true; userId: string; isActive: boolean }> {
    const url = `${environment.apiUrl}/users/${userId}/activate`;
    return firstValueFrom(this.http.patch<{ ok: true; userId: string; isActive: boolean }>(url, {}));
  }
}




