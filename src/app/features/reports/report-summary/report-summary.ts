import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../../core/state/session.store';



type SalesSummaryResponse = {
  franchiseId: string | null;
  from: string;
  to: string;
  sellerId: string | null;
  salesCount: number;
  totalSold: number;
  itemsQty: number;
};

@Component({
  selector: 'app-report-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './report-summary.html',
  styleUrl: './report-summary.scss',
})
export class ReportSummary implements OnInit {
  private http = inject(HttpClient);
  private session = inject(SessionStore);
  private cdr = inject(ChangeDetectorRef);
  public fromDate: Date | null = null;
  public toDate: Date | null = null;
  public sellerId: string | null = null; // opcional si luego filtras por vendedor

  private baseUrl = 'http://localhost:3000';

  public loading = false;
  public error: string | null = null;
  public data: SalesSummaryResponse | null = null;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private getFranchiseId(): string | null {
    const user = this.session.user();
    if (!user) return null;

    // ✅ OWNER/PARTNER: franquicia elegida en el selector (SessionStore)
    if (user.role === 'OWNER' || user.role === 'PARTNER') {
      return this.session.activeFranchiseId() ?? null;
    }

    // ✅ FRANCHISE_OWNER / SELLER: franquicia fija del usuario
    return user.franchiseId ?? null;
  }

  public async load(): Promise<void> {
    const user = this.session.user();
    if (!user) {
      this.data = null;
      this.error = 'No hay sesión activa';
      return;
    }

    const franchiseId = this.getFranchiseId();

    if ((user.role === 'OWNER' || user.role === 'PARTNER') && !franchiseId) {
      this.data = null;
      this.error = 'Selecciona una franquicia para ver el reporte.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.data = null;
    this.cdr.markForCheck();

    try {
      // ✅ Usa EXACTAMENTE el mismo formato que Postman: [from, to)
      // Si tu UI tiene fechas seleccionadas, ponlas aquí.
      // Por ahora: usa HOY (como lo tenías), pero bien armado.
      const today = new Date();

      
      // 🔹 FECHAS DEL RANGO (aquí es donde van esas líneas)
      // ✅ usa lo que eligió el usuario; si no eligió, usa hoy
      const fromPicked = this.fromDate ?? new Date();
      const toPicked = this.toDate ?? fromPicked;

      // ✅ rango [from, to+1dia) para incluir todo el día "to"
      const from = this.isoLocalStart(fromPicked);
      const to = this.isoLocalStart(this.addDays(toPicked, 1));

      const params: Record<string, string> = {
        from,
        to,
      };

      if (franchiseId) params['franchiseId'] = franchiseId;
      if (this.sellerId) params['sellerId'] = this.sellerId;


      const res = await firstValueFrom(
        this.http.get<SalesSummaryResponse>(`${this.baseUrl}/sales/summary`, { params })
      );

      this.data = res ?? null;
    } catch (e: any) {
      this.error = e?.error?.message ?? e?.message ?? 'No se pudo cargar el resumen';
      this.data = null;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
}


  public money(cents: number): string {
    const v = (cents ?? 0) / 100;
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }
  private toYMD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  private isoLocalStart(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return this.toIsoWithOffset(x);
}

private isoLocalEnd(d: Date): string {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return this.toIsoWithOffset(x);
}

private toIsoWithOffset(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const offH = pad(Math.floor(abs / 60));
  const offM = pad(abs % 60);

  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${sign}${offH}:${offM}`;
}



private startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

private addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}



}
