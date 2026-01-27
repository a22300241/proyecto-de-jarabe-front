import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SessionStore } from '../state/session.store';

export interface ProductItem {
  id: string;
  franchiseId: string;
  isActive: boolean;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  missing: number;
  createdAt: string;
}

export interface ProductsResponse {
  page: number;
  pageSize: number;
  total: number;
  items: ProductItem[];
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private session = inject(SessionStore);

  // Ajusta si tu env usa otro nombre:
  private baseUrl = 'http://localhost:3000'; // <-- si ya tienes environment, úsalo

  list(page: number, pageSize: number, franchiseId?: string) {
    const user = this.session.user();
    const role = user?.role;

    const effectiveFranchiseId =
      (role === 'OWNER' || role === 'PARTNER')
        ? (franchiseId ?? '')
        : (user?.franchiseId ?? '');

    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (effectiveFranchiseId) {
      params = params.set('franchiseId', effectiveFranchiseId);
    }

    return this.http.get<ProductsResponse>(`${this.baseUrl}/products`, { params });
  }
}
