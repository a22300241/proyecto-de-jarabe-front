import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface SaleListItem {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  sellerId?: string | null;
  items?: Array<{
    productId: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';

  async list(params: { franchiseId: string | null }): Promise<SaleListItem[]> {
    const q: any = {};
    if (params.franchiseId) q.franchiseId = params.franchiseId;

    return await firstValueFrom(
      this.http.get<SaleListItem[]>(`${this.baseUrl}/sales`, { params: q })
    );
  }

  // ✅ OJO: el backend usa req.user.franchiseId
  // ✅ NO mandar franchiseId para que NO truene con "should not exist"
  async createSale(body: {
  cardNumber: string;
  items: { productId: string; qty: number }[];
}): Promise<any> {
  return await firstValueFrom(
    this.http.post(`${this.baseUrl}/sales`, body)
  );
}

}
