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
// agrega estos tipos en products.service.ts
export type ProductUpdateDto = Partial<{
  name: string;
  price: number;
  isActive: boolean;
}>;

export type ProductRestockDto = { qty: number };

// ✅ AHORA SON OPCIONALES
export type ProductAdjustDto = {
  stockDelta?: number;
  missingDelta?: number;
  reason?: string;
};

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

  async update(productId: string, body: ProductUpdateDto): Promise<ProductItem> {
  const res = await firstValueFrom(
    this.http.patch<ProductItem>(`${this.baseUrl}/products/${productId}`, body)
  );
  return res;
}

async restock(productId: string, body: ProductRestockDto): Promise<ProductItem> {
  const res = await firstValueFrom(
    this.http.patch<ProductItem>(`${this.baseUrl}/products/${productId}/restock`, body)
  );
  return res;
}

// ✅ AJUSTE GENÉRICO (pero con campos opcionales)
async adjust(productId: string, body: ProductAdjustDto): Promise<ProductItem> {
  const res = await firstValueFrom(
    this.http.patch<ProductItem>(`${this.baseUrl}/products/${productId}/adjust`, body)
  );
  return res;
}

// ✅ métodos “bonitos” separados (recomendado para tu UI)
async adjustStock(productId: string, stockDelta: number, reason?: string): Promise<ProductItem> {
  return this.adjust(productId, { stockDelta, reason });
}

async markMissing(productId: string, qty: number, reason?: string): Promise<ProductItem> {
  // faltantes: stock baja y missing sube
  return this.adjust(productId, {
    stockDelta: -Math.abs(qty),
    missingDelta: Math.abs(qty),
    reason,
  });
}

async remove(productId: string): Promise<void> {
  await firstValueFrom(
    this.http.delete<void>(`${this.baseUrl}/products/${productId}`)
  );
}


}
