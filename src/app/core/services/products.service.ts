import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

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

export interface ProductsPage {
  page: number;
  pageSize: number;
  total: number;
  items: ProductItem[];
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);

  list(page = 1, pageSize = 20): Observable<ProductsPage> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http.get<ProductsPage>(`${environment.apiUrl}/products`, { params });
  }

  // Luego agregamos create/edit/toggle cuando toques botones.
}
