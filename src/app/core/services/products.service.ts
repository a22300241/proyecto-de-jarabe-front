import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ProductItem {
  id: string;
  name: string;
  sku?: string | null;
  price: number;
  stock: number;
  missing: number;
  isActive: boolean;
  createdAt: string;
}

// ✅ El backend a veces regresa array y a veces { total, items }
type ProductsApiResponse =
  | ProductItem[]
  | { total: number; items: ProductItem[] };

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';

  private normalize(res: ProductsApiResponse): ProductItem[] {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).items)) return (res as any).items;
    return [];
  }

  async list(params: { franchiseId: string | null }): Promise<ProductItem[]> {
    const q: any = {};
    if (params.franchiseId) q.franchiseId = params.franchiseId;

    const res = await firstValueFrom(
      this.http.get<ProductsApiResponse>(`${this.baseUrl}/products`, { params: q })
    );

    return this.normalize(res);
  }

  // Si tu backend NO tiene /products/search, no pasa nada, no lo usamos.
  async search(params: { q: string; franchiseId: string | null }): Promise<ProductItem[]> {
    const q: any = { q: params.q };
    if (params.franchiseId) q.franchiseId = params.franchiseId;

    const res = await firstValueFrom(
      this.http.get<ProductsApiResponse>(`${this.baseUrl}/products/search`, { params: q })
    );

    return this.normalize(res);
  }
}
