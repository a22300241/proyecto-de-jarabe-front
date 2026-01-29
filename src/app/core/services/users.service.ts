import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Role = 'OWNER' | 'PARTNER' | 'FRANCHISE_OWNER' | 'SELLER';

export type UserDto = {
  id: string;
  email: string;
  name: string;
  role: Role;
  franchiseId: string | null;
  createdAt: string;
  isActive: boolean; // ✅ viene del backend
};

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);

  // si tú ya usas environment, cambia esto a tu env.baseUrl
  private baseUrl = 'http://localhost:3000';

  list(franchiseId?: string): Observable<UserDto[]> {
    let params = new HttpParams();
    if (franchiseId) params = params.set('franchiseId', franchiseId);
    return this.http.get<UserDto[]>(`${this.baseUrl}/users`, { params });
  }

  deactivate(userId: string) {
    return this.http.patch<{ ok: true; userId: string; isActive: boolean }>(
      `${this.baseUrl}/users/${userId}/deactivate`,
      {}
    );
  }

  activate(userId: string) {
    return this.http.patch<{ ok: true; userId: string; isActive: boolean }>(
      `${this.baseUrl}/users/${userId}/activate`,
      {}
    );
  }
}



/* import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Role = 'OWNER' | 'PARTNER' | 'FRANCHISE_OWNER' | 'SELLER';

export type UserItem = {
  id: string;
  email: string;
  name: string;
  role: Role;
  franchiseId: string | null;
  createdAt?: string;
  isActive?: boolean; // 👈 puede venir o no, por eso es opcional
};

type ToggleResponse = {
  ok: boolean;
  userId: string;
  isActive: boolean;
};

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';

  async list(params?: { franchiseId?: string | null }): Promise<UserItem[]> {
    const qp: any = {};
    if (params?.franchiseId) qp.franchiseId = params.franchiseId;

    return await firstValueFrom(
      this.http.get<UserItem[]>(`${this.baseUrl}/users`, { params: qp })
    );
  }

  async deactivate(id: string): Promise<ToggleResponse> {
    return await firstValueFrom(
      this.http.patch<ToggleResponse>(`${this.baseUrl}/users/${id}/deactivate`, {})
    );
  }

  async activate(id: string): Promise<ToggleResponse> {
    return await firstValueFrom(
      this.http.patch<ToggleResponse>(`${this.baseUrl}/users/${id}/activate`, {})
    );
  }
}


 */
