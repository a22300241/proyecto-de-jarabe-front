import { Injectable, Inject } from '@angular/core';
import { ProductItem } from './products.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments.prod';

@Injectable({
  providedIn: 'root',
})
export class Products {
  constructor(private http: HttpClient, @Inject('BASE_URL') private baseUrl: string) {}
  public create(data: { name: string; price: number; stock: number }) {
  return this.http.post<ProductItem>(`${this.baseUrl}/products`, data);
}

}
