import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

// ✅ ESTOS SON LOS QUE TE FALTAN POR EL HTML:
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { PermissionsService } from '../../../core/services/permissions.service';
import { ProductsService, ProductItem } from '../../../core/services/products.service';
import { SessionStore } from '../../../core/state/session.store';

type FranchiseOption = { id: string; name: string };

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,

    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,

    // ✅ para mat-form-field / mat-select / mat-paginator
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
  ],
  templateUrl: './products-list.html',
  styleUrls: ['./products-list.scss'],
})
export class ProductsList {
  public perm = inject(PermissionsService);
  public products = inject(ProductsService);
  public session = inject(SessionStore);

  // ===== UI state =====
  loading = signal(false);
  error = signal<string | null>(null);

  // ===== paginación (aunque el backend aún no pagine, esto evita errores del HTML) =====
  page = signal(1);
  pageSize = signal(20);
  total = signal(0);

  dataSource = new MatTableDataSource<ProductItem>([]);

  displayedColumns = computed(() => {
    const cols = ['name', 'sku', 'price', 'stock', 'missing', 'active', 'createdAt'];
    const canActions =
      this.perm.can('products.edit') || this.perm.can('products.toggleActive');
    return canActions ? [...cols, 'actions'] : cols;
  });

  // ===== selector de franquicia (para OWNER / PARTNER) =====
  // Como todavía no estás usando un endpoint real de franquicias aquí,
  // dejamos opciones mínimas para que NO truene el HTML.
  selectedFranchiseId = signal<string | null>(null);

  // Si luego quieres cargar franquicias reales, aquí lo conectamos.
  franchiseOptions = signal<FranchiseOption[]>([]);

  // OWNER/PARTNER ven selector. Los demás usan su franchiseId.
  showFranchisePicker = computed(() => this.perm.isAny('OWNER', 'PARTNER'));

  async ngOnInit() {
    // set inicial del selected franchise:
    const u = this.session.user();
    if (!this.showFranchisePicker()) {
      // franquicia fija por usuario
      this.selectedFranchiseId.set(u?.franchiseId ?? null);
    } else {
      // OWNER/PARTNER: por default null (GLOBAL) o la que tú elijas.
      this.selectedFranchiseId.set(null);

      // Opciones dummy (para que no truene el select si ya lo tienes en HTML)
      // ✅ Si ya tienes un listado real en otro lado, lo conectamos después.
      this.franchiseOptions.set([
        { id: '', name: 'GLOBAL' },
      ]);
    }

    await this.load();
  }

  setFranchise(franchiseId: string) {
    const normalized = franchiseId === '' ? null : franchiseId;
    this.selectedFranchiseId.set(normalized);
    // reset paginación visual
    this.page.set(1);
    void this.load();
  }

  async pageChanged(ev: PageEvent) {
    this.page.set(ev.pageIndex + 1);
    this.pageSize.set(ev.pageSize);
    await this.load();
  }

  // ===== acciones del HTML (no las tenías en TS, por eso tronaba) =====
  create() {
    // Por ahora NO hacemos modal, solo placeholder para que compile.
    // Si ya tienes pantalla de crear producto, aquí navegas.
    // Ej: this.router.navigate(['/app/products/new'])
    alert('Crear producto (pendiente de conectar)');
  }

  edit(p: ProductItem) {
    alert(`Editar producto: ${p.name} (pendiente de conectar)`);
  }

  async toggleActive(p: ProductItem) {
    try {
      this.loading.set(true);
      this.error.set(null);

      // Si tu backend tiene endpoint para activar/desactivar, aquí lo conectamos.
      // Por ahora solo refrescamos.
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error cambiando estado');
    } finally {
      this.loading.set(false);
    }
  }

  money(value: any): string {
    const n = Number(value ?? 0);
    try {
      return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    } catch {
      return `$${n}`;
    }
  }

  async load() {
    try {
      this.loading.set(true);
      this.error.set(null);

      const u = this.session.user(); // ✅ signals
      const selected = this.selectedFranchiseId();

      // Reglas:
      // - SELLER / FRANCHISE_OWNER: usar SIEMPRE su franquicia
      // - OWNER / PARTNER: pueden elegir franquicia (o null = global si backend lo soporta)
      const franchiseId =
        this.showFranchisePicker() ? (selected ? selected : null) : (u?.franchiseId ?? null);

      const res = await this.products.list({ franchiseId });

      // Backend todavía no pagina: el paginator es solo UI.
      this.dataSource.data = res;
      this.total.set(res.length);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error cargando productos');
      this.dataSource.data = [];
      this.total.set(0);
    } finally {
      this.loading.set(false);
    }
  }
}
