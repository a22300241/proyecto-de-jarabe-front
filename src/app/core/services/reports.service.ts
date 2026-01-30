import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environments.prod';

export type SalesSummaryResponse = {
  franchiseId: string;
  from: string;
  to: string;
  sellerId?: string;
  salesCount: number;
  totalSold: number; // cents
  itemsQty: number;
};

export type DailyCloseItem = any;      // si tienes DTO, cámbialo aquí
export type GlobalSummaryResponse = any; // si tienes DTO, cámbialo aquí
export type AuditItem = any;           // si tienes DTO, cámbialo aquí

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // 5.2 SUMMARY (GET /sales/summary)
  async salesSummary(params: {
    from?: string;      // YYYY-MM-DD
    to?: string;        // YYYY-MM-DD
    sellerId?: string;  // opcional
    franchiseId?: string; // opcional (solo OWNER/PARTNER si tu backend lo permite)
  }): Promise<SalesSummaryResponse> {
    let hp = new HttpParams();
    if (params.from) hp = hp.set('from', params.from);
    if (params.to) hp = hp.set('to', params.to);
    if (params.sellerId) hp = hp.set('sellerId', params.sellerId);
    if (params.franchiseId) hp = hp.set('franchiseId', params.franchiseId);

    return firstValueFrom(
      this.http.get<SalesSummaryResponse>(`${this.baseUrl}/sales/summary`, { params: hp })
    );
  }

  // 6.1 DAILY CLOSE (GET /reports/daily-close)
  async dailyClose(params: {
    day?: string;        // YYYY-MM-DD (si lo usas)
    from?: string;       // YYYY-MM-DD
    to?: string;         // YYYY-MM-DD
    franchiseId?: string;
  }): Promise<DailyCloseItem> {
    let hp = new HttpParams();
    if (params.day) hp = hp.set('day', params.day);
    if (params.from) hp = hp.set('from', params.from);
    if (params.to) hp = hp.set('to', params.to);
    if (params.franchiseId) hp = hp.set('franchiseId', params.franchiseId);

    return firstValueFrom(
      this.http.get<DailyCloseItem>(`${this.baseUrl}/reports/daily-close`, { params: hp })
    );
  }

  // 6.3 GLOBAL SUMMARY (GET /reports/global/summary)
  async globalSummary(params: { from?: string; to?: string }): Promise<GlobalSummaryResponse> {
    let hp = new HttpParams();
    if (params.from) hp = hp.set('from', params.from);
    if (params.to) hp = hp.set('to', params.to);

    return firstValueFrom(
      this.http.get<GlobalSummaryResponse>(`${this.baseUrl}/reports/global/summary`, { params: hp })
    );
  }

  // 7.1 AUDIT (GET /audit)
  async auditList(params: {
    franchiseId?: string;
    from?: string;
    to?: string;
    action?: string;
    userId?: string;
    saleId?: string;   // si tu backend lo soporta
  }): Promise<AuditItem[]> {
    let hp = new HttpParams();
    if (params.franchiseId) hp = hp.set('franchiseId', params.franchiseId);
    if (params.from) hp = hp.set('from', params.from);
    if (params.to) hp = hp.set('to', params.to);
    if (params.action) hp = hp.set('action', params.action);
    if (params.userId) hp = hp.set('userId', params.userId);
    if (params.saleId) hp = hp.set('saleId', params.saleId);

    return firstValueFrom(
      this.http.get<AuditItem[]>(`${this.baseUrl}/audit`, { params: hp })
    );
  }
}
