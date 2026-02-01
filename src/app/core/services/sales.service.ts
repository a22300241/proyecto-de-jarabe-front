import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments.prod';
function isDateOnly(s?: string) {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * ✅ Si llega "YYYY-MM-DD" lo crea en LOCAL TIME (no UTC).
 * Si llega ISO con hora, usa Date normal.
 */
function parseDateSmart(s?: string): Date | null {
  if (!s) return null;

  if (isDateOnly(s)) {
    const [y, m, d] = s.split('-').map(Number);
    // 👇 esto crea fecha LOCAL a las 00:00
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

function dayStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayEnd(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

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
  private baseUrl = environment.apiUrl;

  async list(params: { franchiseId: string | null }): Promise<SaleListItem[]> {
    const q: any = {};
    if (params.franchiseId) q.franchiseId = params.franchiseId;

    return await firstValueFrom(
      this.http.get<SaleListItem[]>(`${this.baseUrl}/sales`, { params: q })
    );
  }

  // ✅ OJO: el backend usa req.user.franchiseId
  // ✅ NO mandar franchiseId para que NO truene con "should not exist"
    createSale(
      body: {
        cardNumber: string;
        items: { productId: string; qty: number }[];
      },
      params?: { franchiseId?: string }
    ) {
      return this.http.post(`${this.baseUrl}/sales`, body, {
        params: params?.franchiseId ? { franchiseId: params.franchiseId } : {},
      });
    }


 getAll(franchiseId?: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/sales`, {
      params: franchiseId ? { franchiseId } : {},
    });
  }

  cancelSale(saleId: string, reason: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/sales/${saleId}/cancel`,
      { reason }
    );
  }

  

}
