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
    'actions',
  ];

  // ✅ CLAVE: para Owner/Master usar franquicia seleccionada (dropdown)
  // y para Seller usar user.franchiseId
  private getActiveFranchiseId(): string | null {
    const s: any = this.session as any;

    // Intentamos varios nombres típicos (sin romper nada si no existen)
    const selected =
      s.selectedFranchiseId?.() ??
      s.activeFranchiseId?.() ??
      s.franchiseIdSelected?.() ??
      s.currentFranchiseId?.() ??
      s.franchiseId?.();

    if (selected) return selected as string;

    // Fallback (Seller normalmente trae franchiseId en el user)
    return this.session.user()?.franchiseId ?? null;
  }

  constructor() {
    effect(() => {
      const franchiseId = this.getActiveFranchiseId();

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
    const franchiseId = this.getActiveFranchiseId();

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

  // =========================
  // ACCIONES (menú)
  // =========================

  public openEdit(p: ProductItem): void {
    this.error = null;

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

        // MERGE local
        const idx = this.products.findIndex(x => x.id === p.id);
        if (idx >= 0) {
          this.products[idx] = { ...this.products[idx], ...updated };
          this.products = [...this.products];
        }

        await this.load(); // para refrescar (backend manda campos completos)
      } catch (e: any) {
        this.error = e?.error?.message ?? 'No se pudo editar el producto';
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  public openRestock(p: ProductItem): void {
    this.error = null;

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

        // MERGE local
        const idx = this.products.findIndex(x => x.id === p.id);
        if (idx >= 0) {
          this.products[idx] = { ...this.products[idx], ...updated };
          this.products = [...this.products];
        }

        await this.load();
      } catch (e: any) {
        this.error = e?.error?.message ?? 'No se pudo resurtir';
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  

  // ✅ NUEVO: Registrar faltantes (solo qty) -> manda stockDelta NEGATIVO y missingDelta POSITIVO
  public openMissing(p: ProductItem): void {
    this.error = null;

    const ref = this.dialog.open(ProductMissingDialog, {
      width: '420px',
      data: { p },
    });

    ref.afterClosed().subscribe(async (result) => {
      if (!result) return;

      try {
        this.loading = true;
        this.error = null;
        this.cdr.markForCheck();

        const qty = Number(result.qty ?? 0);
        const updated = await this.productsService.markMissing(
          p.id,
          result.qty,
          result.reason
        );

        // ✅ Esto es lo correcto para faltantes:
        // - baja stock (stockDelta negativo)
        // - sube missing (missingDelta positivo)
        const payload = {
          stockDelta: -Math.abs(qty),
          missingDelta: Math.abs(qty),
          reason: result.reason,
        };

        const idx = this.products.findIndex(x => x.id === p.id);
        if (idx >= 0) {
          this.products[idx] = { ...this.products[idx], ...updated };
          this.products = [...this.products];
        }

        await this.load();
      } catch (e: any) {
        this.error = e?.error?.message ?? 'No se pudo registrar faltante';
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ✅ CAMBIO: "Eliminar" ahora desactiva (isActive=false) usando PATCH update
  public confirmDelete(p: ProductItem): void {
    this.error = null;

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

        // ✅ en vez de DELETE, hacemos "eliminar" = desactivar
        const updated = await this.productsService.update(p.id, { isActive: false });

        const idx = this.products.findIndex(x => x.id === p.id);
        if (idx >= 0) {
          this.products[idx] = { ...this.products[idx], ...updated };
          this.products = [...this.products];
        }

        await this.load();
      } catch (e: any) {
        this.error = e?.error?.message ?? 'No se pudo eliminar';
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}

/* =========================================================
   DIALOGOS (standalone)
========================================================= */

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Inject } from '@angular/core';

// ✅ EDITAR: quitamos el switch "Activo" y su lógica (mínimo cambio)
@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    // MatSlideToggleModule  ❌ ya no se usa en editar
  ],
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

  constructor(
    public ref: MatDialogRef<ProductEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { p: ProductItem }
  ) {
    this.name = data.p.name ?? '';
    this.priceMXN = ((data.p.price ?? 0) / 100).toString();
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

    // ✅ ya NO mandamos isActive desde editar
    this.ref.close({ name, price });
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

// ✅ NUEVO: Ajustar STOCK manual (+ o -)
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Ajustar stock</h2>

    <div mat-dialog-content class="dlg">
      <div class="muted">{{ data.p.name }}</div>

      <mat-form-field appearance="outline" class="field">
        <mat-label>stockDelta (puede ser + o -)</mat-label>
        <input matInput type="number" [(ngModel)]="stockDelta" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Motivo</mat-label>
        <input matInput [(ngModel)]="reason" placeholder="Inventario / corrección" />
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
class ProductStockAdjustDialog {
  public stockDelta = 0;
  public reason = '';

  constructor(
    public ref: MatDialogRef<ProductStockAdjustDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { p: ProductItem }
  ) {}

  save(): void {
    const s = Number(this.stockDelta ?? 0);
    if (!Number.isFinite(s) || s === 0) return;
    this.ref.close({
      stockDelta: s,
      reason: (this.reason ?? '').trim() || undefined,
    });
  }
}

// ✅ NUEVO: Registrar FALTANTES (qty) -> stockDelta=-qty, missingDelta=+qty
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Registrar faltantes</h2>

    <div mat-dialog-content class="dlg">
      <div class="muted">{{ data.p.name }}</div>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Cantidad faltante</mat-label>
        <input matInput type="number" [(ngModel)]="qty" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Motivo</mat-label>
        <input matInput [(ngModel)]="reason" placeholder="Caducado / roto / merma" />
      </mat-form-field>

      <div class="hint">
        Esto hará: <b>stock -= qty</b> y <b>faltantes += qty</b>.
      </div>
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
    .hint { opacity:.8; font-size: 12px; }
  `]
})
class ProductMissingDialog {
  public qty = 1;
  public reason = '';

  constructor(
    public ref: MatDialogRef<ProductMissingDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { p: ProductItem }
  ) {}

  save(): void {
    const q = Number(this.qty ?? 0);
    if (!Number.isFinite(q) || q <= 0) return;
    this.ref.close({
      qty: q,
      reason: (this.reason ?? '').trim() || undefined,
    });
  }
}

// ✅ "Eliminar" (pero realmente desactiva). Tú pediste que se llame eliminar.
@Component({
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Eliminar producto</h2>

    <div mat-dialog-content>
      ¿Seguro que quieres eliminar <b>{{ data.name }}</b>?
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
