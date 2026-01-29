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

    // ✅ Si no hay sesión, NO navegamos, solo error
    if (!user) {
      this.data = null;
      this.error = 'No hay sesión activa';
      return;
    }

    const franchiseId = this.getFranchiseId();

    // ✅ Si es OWNER/PARTNER y todavía no eligió franquicia, no pegamos al backend
    // (esto evita 401/403 que luego te tumba la sesión por el refreshInterceptor)
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
      const now = new Date();
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);

      const params: any = {
        from: from.toISOString(),
        to: to.toISOString(),
      };

      if (franchiseId) params.franchiseId = franchiseId;

      const res = await firstValueFrom(
        this.http.get<SalesSummaryResponse>(`${this.baseUrl}/sales/summary`, { params })
      );

      this.data = res ?? null;
    } catch (e: any) {
      // ✅ NO logout, NO redirect
      this.error =
        e?.error?.message ??
        e?.message ??
        'No se pudo cargar el resumen';
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
}
