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

  // ✅ nombres por id (de /products)
  public productNameById: Record<string, string> = {};

  // ✅ nombres por id (sacados desde /sales, incluye inactivos si el backend los manda embebidos)
  public productNameByIdFromSales: Record<string, string> = {};

  public displayedColumns = ['createdAt', 'total', 'status', 'items', 'actions'];

  private salesApi = inject(SalesService);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private getFranchiseId(): string | null {
    const user = this.session.user();
    if (!user) return null;

    if (user.role === 'OWNER' || user.role === 'PARTNER') {
      return this.session.activeFranchiseId() ?? null;
    }

    return user.franchiseId ?? null;
  }

  // ✅ ordenar (más nuevo primero)
  public get salesSorted(): SaleListItem[] {
    const arr = Array.isArray(this.sales) ? [...this.sales] : [];
    arr.sort((a: any, b: any) => {
      const ta = new Date(a?.createdAt ?? 0).getTime();
      const tb = new Date(b?.createdAt ?? 0).getTime();
      return tb - ta;
    });
    return arr;
  }

  public formatSaleDate(iso: any): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return new Intl.DateTimeFormat('es-MX', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  }

  public async load(): Promise<void> {
    const franchiseId = this.getFranchiseId();

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      // ✅ 1) Ventas
      const list = await this.salesService.list({ franchiseId });
      this.sales = Array.isArray(list) ? list : [];

      // ✅ 1.1) Sacar nombres desde las ventas (si el backend manda item.product.name)
      const fromSales: Record<string, string> = {};
      for (const s of this.sales as any[]) {
        const items = s?.items ?? [];
        for (const it of items) {
          const pid = it?.productId;
          const pname = it?.product?.name; // 👈 viene en tu JSON
          if (pid && pname) fromSales[pid] = pname;
        }
      }
      this.productNameByIdFromSales = fromSales;

      // ✅ 2) Productos (solo para completar nombres si existen)
      try {
        const products: ProductItem[] = await this.productsService.list({ franchiseId });
        const map: Record<string, string> = {};
        for (const p of products) map[p.id] = p.name;
        this.productNameById = map;
      } catch {
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

  // ✅ Prioridad de nombre:
  // 1) it.product.name (si viene)
  // 2) map desde ventas (inactivos incluidos)
  // 3) map desde /products
  // 4) productId
  public itemLabel(it: any): string {
    const nameFromBackend = it?.product?.name;
    if (nameFromBackend) return nameFromBackend;

    const productId = it?.productId;
    if (!productId) return 'Producto';

    return (
      this.productNameByIdFromSales[productId] ??
      this.productNameById[productId] ??
      productId
    );
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
      await this.load();
    } catch (e: any) {
      this.error = e?.error?.message ?? 'No se pudo cancelar la venta';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
