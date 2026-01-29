import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';

import { SalesService, SaleListItem } from '../../../core/services/sales.service';
import { ProductsService, ProductItem } from '../../../core/services/products.service';
import { SessionStore } from '../../../core/state/session.store';

import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
  ],
  templateUrl: './sales-list.html',
  styleUrl: './sales-list.scss',
})
export class SalesList implements OnInit {
  private salesService = inject(SalesService);
  private productsService = inject(ProductsService);
  private session = inject(SessionStore);
  private cdr = inject(ChangeDetectorRef);

  public loading = false;
  public error: string | null = null;

  public sales: SaleListItem[] = [];

  // productId -> productName
  public productNameById: Record<string, string> = {};

  public displayedColumns = ['createdAt', 'total', 'status', 'items', 'actions'];



private salesApi = inject(SalesService);


  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private getFranchiseId(): string | null {
    const user = this.session.user();
    if (!user) return null;

    // ✅ OWNER/PARTNER: usar franquicia activa del SessionStore (la que eliges en el selector)
    if (user.role === 'OWNER' || user.role === 'PARTNER') {
      return this.session.activeFranchiseId() ?? null;
    }

    // ✅ FRANCHISE_OWNER/SELLER: franquicia fija del usuario
    return user.franchiseId ?? null;
  }

  public async load(): Promise<void> {
    const franchiseId = this.getFranchiseId();

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      // ✅ 1) Primero ventas (esto NO depende de /products)
      const list = await this.salesService.list({ franchiseId });
      this.sales = Array.isArray(list) ? list : [];

      // ✅ 2) Luego intentamos productos SOLO para nombres (si falla, no rompemos)
      try {
        const products: ProductItem[] = await this.productsService.list({ franchiseId });
        const map: Record<string, string> = {};
        for (const p of products) map[p.id] = p.name;
        this.productNameById = map;
      } catch {
        // si /products falla (403), dejamos map vacío y mostramos id como fallback
        this.productNameById = {};
      }
    } catch (e: any) {
      this.sales = [];
      this.error = e?.message ?? 'No se pudo cargar ventas';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  public onReload(): void {
    void this.load();
  }

  public money(cents: number): string {
    const v = (cents ?? 0) / 100;
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  public itemLabel(productId: string): string {
    return this.productNameById[productId] ?? productId;
  }
      async cancelSale(r: SaleListItem) {
  if (r.status !== 'COMPLETED') return;

  const reason = prompt('Motivo de cancelación:');
  if (!reason || !reason.trim()) return;

  this.loading = true;
  this.error = null;
  this.cdr.markForCheck();

  try {
    await firstValueFrom(this.salesApi.cancelSale(r.id, reason.trim()));

    // ✅ opción segura: recargar lista completa (evita pelear con tipos)
    await this.load();
  } catch (e: any) {
    this.error = e?.error?.message ?? 'No se pudo cancelar la venta';
  } finally {
    this.loading = false;
    this.cdr.markForCheck();
  }
}


}



