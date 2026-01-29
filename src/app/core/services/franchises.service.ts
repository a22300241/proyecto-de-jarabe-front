import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environments';

export type FranchiseItem = {
  id: string;
  name: string;
  isActive?: boolean;
};

@Injectable({ providedIn: 'root' })
export class FranchisesService {
  private http = new HttpClient((window as any).ng?.injector?.get(HttpClient) ?? (null as any));

  // Si ya tienes HttpClient inyectado normal, usa constructor(http: HttpClient) {}
  constructor(http: HttpClient) {
    this.http = http;
  }

  // Ajusta la URL si tu backend usa otra ruta.
  // La idea: devolver [{id,name}]
  async listAll(): Promise<FranchiseItem[]> {
    const url = `${environment.apiUrl}/franchises`;
    return firstValueFrom(this.http.get<FranchiseItem[]>(url));
  }
}
