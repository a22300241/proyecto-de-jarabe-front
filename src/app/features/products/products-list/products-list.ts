import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';

import { ProductsService, ProductItem } from '../../../core/services/products.service';
import { SessionStore } from '../../../core/state/session.store';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,

    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
  ],
  templateUrl: './products-list.html',
  styleUrl: './products-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsList {
  private productsService = inject(ProductsService);
  private session = inject(SessionStore);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private router = inject(Router);

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
    'actions', // ✅ NUEVA
  ];

  constructor() {
    effect(() => {
      const franchiseId = this.session.user()?.franchiseId ?? null;

      if (!franchiseId) {
        this.products = [];
        this.error = null;
        this.loading = false;
        this.cdr.markForCheck();
        return;
      }

      void this.load();
    });
  }

  public money(cents: number): string {
    const v = (cents ?? 0) / 100;
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  public async load(): Promise<void> {
    const franchiseId = this.session.user()?.franchiseId ?? null;

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      this.products = await this.productsService.list({ franchiseId, includeInactive: true });
    } catch (e: any) {
      this.products = [];
      this.error = e?.error?.message ?? e?.message ?? 'No se pudieron cargar productos';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  public onReload(): void {
    void this.load();
  }

  // =========================
  // ACCIONES (menú)
  // =========================
  public openEdit(p: ProductItem): void {
    const ref = this.dialog.open(ProductEditDialog, {
      width: '420px',
      data: { p },
    });

    ref.afterClosed().subscribe(async (result) => {
      if (!result) return;

      try {
        this.loading = true;
        this.error = null;
        this.cdr.markForCheck();

        const updated = await this.productsService.update(p.id, result);

        // update local
        const idx = this.products.findIndex(x => x.id === p.id);
          if (idx >= 0) {
            this.products[idx] = { ...this.products[idx], ...updated };
            this.products = [...this.products];
          }
          this.cdr.markForCheck();
          await this.load();          // ✅ agrega esto
          this.cdr.markForCheck();
      } catch (e: any) {
        this.error = e?.error?.message ?? 'No se pudo editar el producto';
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  public openRestock(p: ProductItem): void {
    const ref = this.dialog.open(ProductRestockDialog, {
      width: '380px',
      data: { p },
    });

    ref.afterClosed().subscribe(async (result) => {
      if (!result) return;

      try {
        this.loading = true;
        this.error = null;
        this.cdr.markForCheck();

        const updated = await this.productsService.restock(p.id, { qty: result.qty });

       const idx = this.products.findIndex(x => x.id === p.id);
        if (idx >= 0) {
          this.products[idx] = { ...this.products[idx], ...updated };
          this.products = [...this.products];
        }
        this.cdr.markForCheck();
        await this.load();          // ✅ agrega esto
        this.cdr.markForCheck();

      } catch (e: any) {
        this.error = e?.error?.message ?? 'No se pudo resurtir';
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  public openAdjust(p: ProductItem): void {
    const ref = this.dialog.open(ProductAdjustDialog, {
      width: '420px',
      data: { p },
    });

    ref.afterClosed().subscribe(async (result) => {
      if (!result) return;

      try {
        this.loading = true;
        this.error = null;
        this.cdr.markForCheck();

        const updated = await this.productsService.adjust(p.id, result);

        const idx = this.products.findIndex(x => x.id === p.id);
        if (idx >= 0) {
          this.products[idx] = { ...this.products[idx], ...updated };
          this.products = [...this.products];
        }
        await this.load();          // ✅ agrega esto
        this.cdr.markForCheck();
        this.cdr.markForCheck();

      } catch (e: any) {
        this.error = e?.error?.message ?? 'No se pudo ajustar inventario';
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  public confirmDelete(p: ProductItem): void {
    const ref = this.dialog.open(ConfirmDeleteDialog, {
      width: '420px',
      data: { name: p.name },
    });

    ref.afterClosed().subscribe(async (ok) => {
      if (!ok) return;

      try {
        this.loading = true;
        this.error = null;
        this.cdr.markForCheck();

        await this.productsService.remove(p.id);

        this.products = this.products.filter(x => x.id !== p.id);
      } catch (e: any) {
        this.error = e?.error?.message ?? 'No se pudo eliminar';
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
public goNew(): void {
  void this.router.navigateByUrl('/app/products/new');
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

/* =========================================================
   DIALOGOS (standalone) - todo aquí mismo para no hacer 10 archivos
========================================================= */

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Inject } from '@angular/core';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>Editar producto</h2>

    <div mat-dialog-content class="dlg">
      <mat-form-field appearance="outline" class="field">
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="name" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Precio (MXN)</mat-label>
        <input matInput [(ngModel)]="priceMXN" placeholder="Ej: 18 o 18.50" />
      </mat-form-field>

      <mat-slide-toggle [(ngModel)]="isActive">Activo</mat-slide-toggle>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(null)">Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()">Guardar</button>
    </div>
  `,
  styles: [`
    .dlg { display:flex; flex-direction:column; gap:12px; padding-top:8px; }
    .field { width:100%; }
  `]
})
class ProductEditDialog {
  public name = '';
  public priceMXN = '';
  public isActive = true;

  constructor(
    public ref: MatDialogRef<ProductEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { p: ProductItem }
  ) {
    this.name = data.p.name ?? '';
    this.priceMXN = ((data.p.price ?? 0) / 100).toString();
    this.isActive = !!data.p.isActive;
  }

  private toCents(value: string): number {
    const n = Number((value ?? '').toString().replace(',', '.'));
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
  }

  save(): void {
    const name = (this.name ?? '').trim();
    const price = this.toCents(this.priceMXN);

    if (!name) return;

    // price puede ser 0 si no lo quiere cambiar: aquí lo mandamos siempre
    this.ref.close({ name, price, isActive: this.isActive });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Resurtir</h2>

    <div mat-dialog-content class="dlg">
      <div class="muted">{{ data.p.name }}</div>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Cantidad a sumar</mat-label>
        <input matInput type="number" [(ngModel)]="qty" />
      </mat-form-field>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(null)">Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()">Aplicar</button>
    </div>
  `,
  styles: [`
    .dlg { display:flex; flex-direction:column; gap:12px; padding-top:8px; }
    .field { width:100%; }
    .muted { opacity:.75; }
  `]
})
class ProductRestockDialog {
  public qty = 1;

  constructor(
    public ref: MatDialogRef<ProductRestockDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { p: ProductItem }
  ) {}

  save(): void {
    const q = Number(this.qty ?? 0);
    if (!Number.isFinite(q) || q <= 0) return;
    this.ref.close({ qty: q });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Ajustar inventario</h2>

    <div mat-dialog-content class="dlg">
      <div class="muted">{{ data.p.name }}</div>

      <mat-form-field appearance="outline" class="field">
        <mat-label>stockDelta</mat-label>
        <input matInput type="number" [(ngModel)]="stockDelta" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>missingDelta</mat-label>
        <input matInput type="number" [(ngModel)]="missingDelta" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Motivo</mat-label>
        <input matInput [(ngModel)]="reason" placeholder="Caducado / roto" />
      </mat-form-field>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(null)">Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()">Aplicar</button>
    </div>
  `,
  styles: [`
    .dlg { display:flex; flex-direction:column; gap:12px; padding-top:8px; }
    .field { width:100%; }
    .muted { opacity:.75; }
  `]
})
class ProductAdjustDialog {
  public stockDelta = 0;
  public missingDelta = 0;
  public reason = '';

  constructor(
    public ref: MatDialogRef<ProductAdjustDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { p: ProductItem }
  ) {}

  save(): void {
    const s = Number(this.stockDelta ?? 0);
    const m = Number(this.missingDelta ?? 0);
    if (!Number.isFinite(s) || !Number.isFinite(m)) return;

    this.ref.close({
      stockDelta: s,
      missingDelta: m,
      reason: (this.reason ?? '').trim() || undefined,
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Eliminar producto</h2>

    <div mat-dialog-content>
      ¿Seguro que quieres eliminar <b>{{ data.name }}</b>?
      <div class="muted">Esto lo borra de la base de datos.</div>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(false)">Cancelar</button>
      <button mat-raised-button color="warn" (click)="ref.close(true)">Eliminar</button>
    </div>
  `,
  styles: [`
    .muted { opacity:.75; margin-top:6px; }
  `]
})
class ConfirmDeleteDialog {
  constructor(
    public ref: MatDialogRef<ConfirmDeleteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { name: string }
  ) {}
}





/* import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
} from '@angular/core';

import { RouterModule } from '@angular/router'; // ✅ agrega esto
import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';


import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';


import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { Router } from '@angular/router';
import { ProductsService, ProductItem } from '../../../core/services/products.service';
import { SessionStore } from '../../../core/state/session.store';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // ✅ agrega esto
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
  ],
  templateUrl: './products-list.html',
  styleUrl: './products-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsList {
  private productsService = inject(ProductsService);
  private session = inject(SessionStore);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
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
      const u = this.session.user();
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
  public goNew(): void {
     console.log('CLICK NUEVO'); // ✅
    void this.router.navigateByUrl('/app/products/new');
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
 */
