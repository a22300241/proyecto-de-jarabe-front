import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PermissionsService } from '../../../core/services/permissions.service';
import { SalesService, SaleItem } from '../../../core/services/sales.service';
import { SessionStore } from '../../../core/state/session.store';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sales-list.html',
  styleUrls: ['./sales-list.scss'],
})
export class SalesList {
  public perm = inject(PermissionsService);
  public sales = inject(SalesService);
  public session = inject(SessionStore);

  loading = signal(false);
  error = signal<string | null>(null);

  dataSource = new MatTableDataSource<SaleItem>([]);
  total = signal(0);

  displayedColumns = computed(() => ['createdAt', 'seller', 'salesCount', 'totalSold']);

  @ViewChild(MatPaginator) paginator?: MatPaginator;

  ngOnInit() {
    this.load();
  }

  async load() {
    try {
      this.loading.set(true);
      this.error.set(null);

      const u = this.session.user();
      const franchiseId = u?.franchiseId ?? null;

      // ✅ NO mandamos page/pageSize al backend
      const rows = await this.sales.list({ franchiseId });

      this.dataSource.data = rows;
      this.total.set(rows.length);

      // conectar paginator (paginación front)
      queueMicrotask(() => {
        if (this.paginator) this.dataSource.paginator = this.paginator;
      });
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error cargando ventas');
    } finally {
      this.loading.set(false);
    }
  }

  pageChanged(_: PageEvent) {
    // nada: MatTableDataSource paginará solo
  }
}
