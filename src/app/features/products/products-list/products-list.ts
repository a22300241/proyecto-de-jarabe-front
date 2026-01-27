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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { PermissionsService } from '../../../core/services/permissions.service';
import { ProductsService, ProductItem } from '../../../core/services/products.service';
import { FranchisesService, FranchiseItem } from '../../../core/services/franchises.service';
import { SessionStore } from '../../../core/state/session.store';

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
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './products-list.html',
  styleUrls: ['./products-list.scss'],
})
export class ProductsList {
  public perm = inject(PermissionsService);
  private products = inject(ProductsService);
  private franchises = inject(FranchisesService);
  private session = inject(SessionStore);

  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(1);
  pageSize = signal(20);
  total = signal(0);

  dataSource = new MatTableDataSource<ProductItem>([]);

  // ✅ Solo para OWNER/PARTNER
  showFranchisePicker = computed(() => this.perm.isAny('OWNER', 'PARTNER'));

  franchiseOptions = signal<FranchiseItem[]>([]);
  selectedFranchiseId = signal<string>(localStorage.getItem('selectedFranchiseId') ?? '');

  displayedColumns = computed(() => {
    const cols = ['name', 'sku', 'price', 'stock', 'missing', 'active', 'createdAt'];
    const canActions = this.perm.can('products.edit') || this.perm.can('products.toggleActive');
    return canActions ? [...cols, 'actions'] : cols;
  });

  ngOnInit() {
    if (this.showFranchisePicker()) {
      this.loadFranchises();
    }
    this.load();
  }

  loadFranchises() {
    this.franchises.listAll().subscribe({
      next: (items) => {
        this.franchiseOptions.set(items ?? []);
        // Si no hay seleccionado, toma el primero
        if (!this.selectedFranchiseId() && items?.length) {
          this.setFranchise(items[0].id);
        }
      },
      error: () => {
        // no bloqueamos productos por esto
        this.franchiseOptions.set([]);
      },
    });
  }

  setFranchise(id: string) {
    this.selectedFranchiseId.set(id);
    localStorage.setItem('selectedFranchiseId', id);
    this.page.set(1);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    const role = this.session.user()?.role;
    const needsPick = role === 'OWNER' || role === 'PARTNER';

    const selected = this.selectedFranchiseId();
    if (needsPick && !selected) {
      this.loading.set(false);
      this.error.set('Selecciona una franquicia para ver productos.');
      return;
    }

    this.products.list(this.page(), this.pageSize(), selected).subscribe({
      next: (res) => {
        this.total.set(res.total);
        this.dataSource.data = res.items ?? [];
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Error cargando productos');
        this.loading.set(false);
      },
    });
  }

  pageChanged(ev: PageEvent) {
    this.page.set(ev.pageIndex + 1);
    this.pageSize.set(ev.pageSize);
    this.load();
  }

  money(n: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n ?? 0);
  }

  // acciones (las conectas después)
  create() {}
  edit(p: ProductItem) {}
  toggleActive(p: ProductItem) {}
}
