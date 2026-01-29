import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface GlobalSummary {
  // deja any si tu backend devuelve más campos
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';

  async globalSummary(): Promise<GlobalSummary> {
    return await firstValueFrom(
      this.http.get<GlobalSummary>(`${this.baseUrl}/reports/global/summary`)
    );
  }

  async dailyClose(franchiseId: string, date?: string): Promise<any> {
    const params: any = { franchiseId };
    if (date) params.date = date;

    return await firstValueFrom(
      this.http.get(`${this.baseUrl}/reports/daily-close`, { params })
    );
  }
}
