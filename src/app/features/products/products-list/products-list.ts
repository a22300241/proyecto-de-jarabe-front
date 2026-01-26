import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PermissionsService } from '../../../core/services/permissions.service';
import { ProductsService } from '../../../core/services/products.service';

export type ProductItem = {
  id: string;
  franchiseId: string;
  isActive: boolean;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  missing: number;
  createdAt: string;
};

type ProductsResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: ProductItem[];
};

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './products-list.html',
  styleUrls: ['./products-list.scss'],
})
export class ProductsList {
  // ✅ PUBLIC para poder usarlo en el HTML
  public perm = inject(PermissionsService);
  private products = inject(ProductsService);

  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(1);
  pageSize = signal(20);
  total = signal(0);

  dataSource = new MatTableDataSource<ProductItem>([]);

  displayedColumns = computed(() => {
  const cols = ['name', 'sku', 'price', 'stock', 'missing', 'active', 'createdAt'];
  const canActions = this.perm.can('products.edit') || this.perm.can('products.toggleActive');
  return canActions ? [...cols, 'actions'] : cols;
});



  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    // ✅ tu service seguramente es: list(page: number, pageSize: number)
    this.products.list(this.page(), this.pageSize()).subscribe({
      next: (res: ProductsResponse) => {
        this.total.set(res.total ?? 0);
        this.dataSource.data = res.items ?? [];
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'No se pudo cargar productos');
      },
    });
  }

  pageChanged(ev: PageEvent) {
    this.page.set(ev.pageIndex + 1);
    this.pageSize.set(ev.pageSize);
    this.load();
  }

  money(v: number) {
    try {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(v ?? 0);
    } catch {
      return `$${v ?? 0}`;
    }
  }

  // === Acciones (solo se muestran si hay permiso) ===
  edit(p: ProductItem) {
    console.log('edit', p);
  }

  toggleActive(p: ProductItem) {
    console.log('toggleActive', p);
  }
}
