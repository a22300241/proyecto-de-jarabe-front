import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments.prod';
import { firstValueFrom } from 'rxjs';

export interface FranchiseItem {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class FranchisesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // ✅ Mantén list() porque ya lo usas en franchises-list.ts
  public list(): Promise<FranchiseItem[]> {
    return this.listAll();
  }

  // ✅ Mantén listAll() porque lo usa shell.ts (compatibilidad)
  public async listAll(): Promise<FranchiseItem[]> {
    const url = `${this.baseUrl}/franchises`;
    return firstValueFrom(this.http.get<FranchiseItem[]>(url));
  }

  public getById(franchiseId: string): Promise<FranchiseItem> {
    return firstValueFrom(
      this.http.get<FranchiseItem>(`${this.baseUrl}/franchises/${franchiseId}`)
    );
  }

  public create(body: { name: string }): Promise<FranchiseItem> {
    return firstValueFrom(
      this.http.post<FranchiseItem>(`${this.baseUrl}/franchises`, body)
    );
  }
}
