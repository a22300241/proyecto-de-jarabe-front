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

  // ✅ LISTAR (incluye inactivos si el backend lo soporta)
  async list(params: { franchiseId: string | null; includeInactive?: boolean }): Promise<ProductItem[]> {
    const q: any = {};
    if (params.franchiseId) q.franchiseId = params.franchiseId;

    // 👇 aunque el backend lo ignore, NO rompe
    q.includeInactive = params.includeInactive ?? true;

    const res = await firstValueFrom(
      this.http.get<ProductsApiResponse>(`${this.baseUrl}/products`, { params: q })
    );
    return this.normalize(res);
  }

  async search(params: { q: string; franchiseId: string | null }): Promise<ProductItem[]> {
    const q: any = { q: params.q };
    if (params.franchiseId) q.franchiseId = params.franchiseId;

    const res = await firstValueFrom(
      this.http.get<ProductsApiResponse>(`${this.baseUrl}/products/search`, { params: q })
    );
    return this.normalize(res);
  }

  // ✅ CREAR
  async create(body: { name: string; price: number; stock: number; sku?: string | null }): Promise<ProductItem> {
    return await firstValueFrom(
      this.http.post<ProductItem>(`${this.baseUrl}/products`, body)
    );
  }

  // ✅ EDITAR
  async update(productId: string, body: { name?: string; price?: number; isActive?: boolean }): Promise<Partial<ProductItem>> {
    return await firstValueFrom(
      this.http.patch<Partial<ProductItem>>(`${this.baseUrl}/products/${productId}`, body)
    );
  }

  // ✅ RESURTIR
  async restock(productId: string, body: { qty: number }): Promise<Partial<ProductItem>> {
    return await firstValueFrom(
      this.http.patch<Partial<ProductItem>>(`${this.baseUrl}/products/${productId}/restock`, body)
    );
  }

  // ✅ AJUSTAR
  async adjust(productId: string, body: { stockDelta: number; missingDelta: number; reason?: string }): Promise<Partial<ProductItem>> {
    return await firstValueFrom(
      this.http.patch<Partial<ProductItem>>(`${this.baseUrl}/products/${productId}/adjust`, body)
    );
  }

  // ✅ ELIMINAR
  async remove(productId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/products/${productId}`)
    );
  }

}
