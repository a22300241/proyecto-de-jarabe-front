import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiUser } from './api';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // OWNER/PARTNER: todos
  listAll() {
    return this.http.get<ApiUser[]>(`${this.base}/users`);
  }

  // FRANCHISE_OWNER: vendedores de su franquicia
  listMyFranchiseSellers() {
    return this.http.get<ApiUser[]>(`${this.base}/users/franchise`);
  }

  deactivate(userId: string) {
    return this.http.patch(`${this.base}/users/${userId}/deactivate`, {});
  }

  activate(userId: string) {
    return this.http.patch(`${this.base}/users/${userId}/activate`, {});
  }

  hardDelete(userId: string) {
    return this.http.delete(`${this.base}/users/${userId}`);
  }
}
