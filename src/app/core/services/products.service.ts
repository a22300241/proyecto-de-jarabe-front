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

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);

  // ⚠️ AJUSTA esta URL si tu backend es otro (ej: http://localhost:3000)
  private baseUrl = 'http://localhost:3000';

  /**
   * Lista productos por franquicia (si franchiseId viene null, backend decide qué hacer)
   * Ajusta el endpoint si el tuyo es diferente.
   */
  async list(params: { franchiseId: string | null }): Promise<ProductItem[]> {
    const q: any = {};
    if (params.franchiseId) q.franchiseId = params.franchiseId;

    return await firstValueFrom(
      this.http.get<ProductItem[]>(`${this.baseUrl}/products`, { params: q })
    );
  }

  /**
   * 🔎 Buscar por texto (nombre/sku)
   * Si tu backend usa otro endpoint, cámbialo aquí.
   */
  async search(params: { q: string; franchiseId: string | null }): Promise<ProductItem[]> {
    const q: any = { q: params.q };
    if (params.franchiseId) q.franchiseId = params.franchiseId;

    return await firstValueFrom(
      this.http.get<ProductItem[]>(`${this.baseUrl}/products/search`, { params: q })
    );
  }
}
