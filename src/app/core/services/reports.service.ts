import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environments.prod';

export type SalesSummaryResponse = {
  franchiseId: string;
  from: string | null;
  to: string | null;
  sellerId?: string | null;
  salesCount: number;
  totalSold: number; // cents
  itemsQty: number;
};

export type DailyCloseItem = any;
export type GlobalSummaryResponse = any;
export type AuditItem = any;

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // 5.2 SUMMARY (GET /sales/summary)
  async salesSummary(params: {
    from?: string;
    to?: string;
    sellerId?: string;
    franchiseId?: string;
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
    day?: string;        // si lo soportas
    from?: string;       // ISO o YYYY-MM-DD (según backend)
    to?: string;         // ISO o YYYY-MM-DD
    franchiseId?: string;
    sellerId?: string;   // ✅ ya lo mandamos
  }): Promise<DailyCloseItem> {
    let hp = new HttpParams();
    if (params.day) hp = hp.set('day', params.day);
    if (params.from) hp = hp.set('from', params.from);
    if (params.to) hp = hp.set('to', params.to);
    if (params.franchiseId) hp = hp.set('franchiseId', params.franchiseId);
    if (params.sellerId) hp = hp.set('sellerId', params.sellerId); // ✅ FIX

    return firstValueFrom(
      this.http.get<DailyCloseItem>(`${this.baseUrl}/reports/daily-close`, { params: hp })
    );
  }

  // 6.3 GLOBAL SUMMARY
  async globalSummary(params: { from?: string; to?: string }): Promise<GlobalSummaryResponse> {
    let hp = new HttpParams();
    if (params.from) hp = hp.set('from', params.from);
    if (params.to) hp = hp.set('to', params.to);

    return firstValueFrom(
      this.http.get<GlobalSummaryResponse>(`${this.baseUrl}/reports/global/summary`, { params: hp })
    );
  }

  // 7.1 AUDIT
  async auditList(params: {
    franchiseId?: string;
    from?: string;
    to?: string;
    action?: string;
    userId?: string;
    saleId?: string;
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


/* import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environments.prod';

export type SalesSummaryResponse = {
  franchiseId: string;
  from: string | null;     // a veces backend regresa null si no mandas fechas
  to: string | null;       // a veces backend regresa null si no mandas fechas
  sellerId?: string | null;
  salesCount: number;
  totalSold: number; // cents
  itemsQty: number;
};

export type DailyCloseItem = any;
export type GlobalSummaryResponse = any;
export type AuditItem = any;

export type SalesSummaryParams = {
  from?: string;        // YYYY-MM-DD o ISO (lo mandamos tal cual)
  to?: string;          // YYYY-MM-DD o ISO
  sellerId?: string;    // UUID opcional
  franchiseId?: string; // opcional si tu backend lo permite
};

export type DailyCloseParams = {
  day?: string;         // YYYY-MM-DD
  from?: string;        // YYYY-MM-DD o ISO
  to?: string;          // YYYY-MM-DD o ISO
  franchiseId?: string;
  sellerId?: string;    // ✅ UUID opcional (IMPORTANTE)
};

export type GlobalSummaryParams = {
  from?: string;
  to?: string;
};

export type AuditListParams = {
  franchiseId?: string;
  from?: string;
  to?: string;
  action?: string;
  userId?: string;
  saleId?: string;
};

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // ✅ helper: agrega el param solo si tiene valor
  private setIf(hp: HttpParams, key: string, value: any): HttpParams {
    const v = (value ?? '').toString().trim();
    if (!v) return hp;
    return hp.set(key, v);
  }

  // 5.2 SUMMARY (GET /sales/summary)
  async salesSummary(params: SalesSummaryParams): Promise<SalesSummaryResponse> {
    let hp = new HttpParams();
    hp = this.setIf(hp, 'from', params.from);
    hp = this.setIf(hp, 'to', params.to);
    hp = this.setIf(hp, 'sellerId', params.sellerId);
    hp = this.setIf(hp, 'franchiseId', params.franchiseId);

    return firstValueFrom(
      this.http.get<SalesSummaryResponse>(`${this.baseUrl}/sales/summary`, { params: hp })
    );
  }

  // 6.1 DAILY CLOSE (GET /reports/daily-close)
  async dailyClose(params: DailyCloseParams): Promise<DailyCloseItem> {
    let hp = new HttpParams();
    hp = this.setIf(hp, 'day', params.day);
    hp = this.setIf(hp, 'from', params.from);
    hp = this.setIf(hp, 'to', params.to);
    hp = this.setIf(hp, 'franchiseId', params.franchiseId);

    // ✅ ESTE ERA EL FALTANTE: mandar sellerId al backend
    hp = this.setIf(hp, 'sellerId', params.sellerId);

    return firstValueFrom(
      this.http.get<DailyCloseItem>(`${this.baseUrl}/reports/daily-close`, { params: hp })
    );
  }

  // 6.3 GLOBAL SUMMARY (GET /reports/global/summary)
  async globalSummary(params: GlobalSummaryParams): Promise<GlobalSummaryResponse> {
    let hp = new HttpParams();
    hp = this.setIf(hp, 'from', params.from);
    hp = this.setIf(hp, 'to', params.to);

    return firstValueFrom(
      this.http.get<GlobalSummaryResponse>(`${this.baseUrl}/reports/global/summary`, { params: hp })
    );
  }

  // 7.1 AUDIT (GET /audit)
  async auditList(params: AuditListParams): Promise<AuditItem[]> {
    let hp = new HttpParams();
    hp = this.setIf(hp, 'franchiseId', params.franchiseId);
    hp = this.setIf(hp, 'from', params.from);
    hp = this.setIf(hp, 'to', params.to);
    hp = this.setIf(hp, 'action', params.action);
    hp = this.setIf(hp, 'userId', params.userId);
    hp = this.setIf(hp, 'saleId', params.saleId);

    return firstValueFrom(
      this.http.get<AuditItem[]>(`${this.baseUrl}/audit`, { params: hp })
    );
  }
}
 */