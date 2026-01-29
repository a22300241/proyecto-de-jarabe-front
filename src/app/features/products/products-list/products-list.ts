import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ProductsService, ProductItem } from '../../../core/services/products.service';
import { SessionStore } from '../../../core/state/session.store';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
  ],
  templateUrl: './products-list.html',
  styleUrl: './products-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsList {
  private productsService = inject(ProductsService);
  private session = inject(SessionStore);
  private cdr = inject(ChangeDetectorRef);

  public loading = false;
  public error: string | null = null;

  public products: ProductItem[] = [];

  public displayedColumns: string[] = [
    'name',
    'sku',
    'price',
    'stock',
    'missing',
    'isActive',
    'createdAt',
  ];

  constructor() {
    // ✅ CADA VEZ que cambia la franquicia del SessionStore => recarga productos
    effect(() => {
      const franchiseId = this.session.user()?.franchiseId ?? null;

      // Owner/Partner: si todavía no selecciona franquicia, no consultamos
      if (!franchiseId) {
        this.products = [];
        this.error = null;
        this.loading = false;
        this.cdr.markForCheck();
        return;
      }

      // carga automática
      void this.load();
    });
  }

  public async load(): Promise<void> {
    const franchiseId = this.session.user()?.franchiseId ?? null;

    if (!franchiseId) {
      this.products = [];
      this.error = null;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      const list = await this.productsService.list({ franchiseId });
      this.products = Array.isArray(list) ? list : [];
    } catch (e: any) {
      this.products = [];
      this.error = e?.message ?? 'No se pudo cargar productos';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  // Botón "Recargar" (si lo tienes en HTML)
  public onReload(): void {
    void this.load();
  }

  // Botón "Nuevo" (si todavía no tienes modal, no hacemos nada para no romper)
  public onNew(): void {
    // Aquí luego conectamos el alta de producto si lo necesitas
  }

  public money(cents: number): string {
    const v = (cents ?? 0) / 100;
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  public yesNo(v: boolean): string {
    return v ? 'Activo' : 'Inactivo';
  }

  public fmtDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString('es-MX');
  }
}
