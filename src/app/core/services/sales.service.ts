import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface SaleItem {
  createdAt: string;
  sellerName?: string | null;
  salesCount: number;
  totalSold: number;
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private http = inject(HttpClient);

  // ⚠️ AJUSTA esta URL si tu backend es otro
  private baseUrl = 'http://localhost:3000';

  /**
   * Resumen/listado (sin page/pageSize para que no truene el backend)
   * Ajusta endpoint si el tuyo es otro.
   */
  async list(params: { franchiseId: string | null }): Promise<SaleItem[]> {
    const q: any = {};
    if (params.franchiseId) q.franchiseId = params.franchiseId;

    return await firstValueFrom(
      this.http.get<SaleItem[]>(`${this.baseUrl}/sales/summary`, { params: q })
    );
  }

  /**
   * Crear venta con muchos items
   */
  async createSale(body: {
    franchiseId: string | null;
    items: { productId: string; qty: number }[];
  }): Promise<any> {
    return await firstValueFrom(
      this.http.post(`${this.baseUrl}/sales`, body)
    );
  }
}
