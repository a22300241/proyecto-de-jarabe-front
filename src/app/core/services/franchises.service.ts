import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface FranchiseItem {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class FranchisesService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000'; // ajusta si usas environment

  listAll() {
    return this.http.get<FranchiseItem[]>(`${this.baseUrl}/franchises`);
  }
}
