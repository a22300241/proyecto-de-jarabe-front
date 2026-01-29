import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';


import { Router } from '@angular/router';
import { ProductsService, ProductItem } from '../../../core/services/products.service';
import { SalesService } from '../../../core/services/sales.service';
import { SessionStore } from '../../../core/state/session.store';
import { M } from '@angular/cdk/keycodes';

type SaleItem = {
  productId: string;
  name: string;
  price: number; // centavos
  qty: number;
};

@Component({
  selector: 'app-sale-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatAutocompleteModule,
  ],
  templateUrl: './sale-create.html',
  styleUrl: './sale-create.scss',
})
export class SaleCreate implements OnInit {
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private salesService = inject(SalesService);
  private session = inject(SessionStore);
  private cdr = inject(ChangeDetectorRef);
  public selectedProduct: ProductItem | null = null;
  public loading = false;
  public error: string | null = null;
  private dialog = inject(MatDialog);


  // ✅ En blanco (como pediste)
  public cardNumber = '';

  // input de búsqueda
  public scan = '';
  public qty = 1;

  // cache de productos para buscar por nombre
  public productsCache: ProductItem[] = [];
  public filteredProducts: ProductItem[] = [];

  // venta actual
  public items: SaleItem[] = [];
  public displayedColumns = ['name', 'qty', 'price', 'subtotal', 'actions'];

  async ngOnInit(): Promise<void> {
    await this.loadProducts();
  }
  public confirmRemove(r: SaleItem): void {
    const ok = confirm(`¿Seguro de eliminar "${r.name}" de la venta?`);

    if (!ok) return;

    this.items = this.items.filter(x => x.productId !== r.productId);
    this.cdr.markForCheck();
  }


  // =====================
  // Franquicia activa
  // =====================
  private getFranchiseId(): string | null {
    const user = this.session.user();
    if (!user) return null;

    if (user.role === 'OWNER' || user.role === 'PARTNER') {
      // ✅ en tu store ya existe el signal
      return this.session.activeFranchiseId() ?? null;
    }

    // FRANCHISE_OWNER / SELLER
    return user.franchiseId ?? null;
  }
  public selectProduct(p: ProductItem): void {
    this.selectedProduct = p;
    this.scan = p?.name ?? '';
  }
  // =====================
  // Productos
  // =====================
  public async loadProducts(): Promise<void> {
    const franchiseId = this.getFranchiseId();

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      // ✅ tu ProductsService.list ya acepta { franchiseId }
      const list = await this.productsService.list({ franchiseId });

      // algunos backends regresan {items,total}, pero el tuyo en postman se ve { total, items }
      // así que lo toleramos:
      const arr = Array.isArray(list as any)
        ? (list as any)
        : Array.isArray((list as any)?.items)
          ? (list as any).items
          : [];

      this.productsCache = arr;
      this.applyFilter();
    } catch (e: any) {
      this.productsCache = [];
      this.filteredProducts = [];
      this.error = e?.error?.message ?? e?.message ?? 'No se pudieron cargar productos';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  public onSearchChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = (this.scan ?? '').trim().toLowerCase();

    if (!q) {
      // no llenes el dropdown si no escribe nada
      this.filteredProducts = [];
      return;
    }

    this.filteredProducts = this.productsCache
      .filter((p) => (p?.isActive ?? true) === true)
      .filter((p) => (p?.name ?? '').toLowerCase().includes(q))
      .slice(0, 10);
  }

  public productLabel(p: ProductItem): string {
    const price = this.money(p.price);
    return `${p.name} — ${price}`;
  }

  // =====================
  // Items
  // =====================
  public addSelected(p: ProductItem): void {
    if (!p?.id) return;
    this.selectedProduct = p;
    const qty = Number(this.qty ?? 1);
    if (!qty || qty <= 0) return;

    const existing = this.items.find((x) => x.productId === p.id);
    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push({
        productId: p.id,
        name: p.name,
        price: p.price,
        qty,
      });
      this.items = [...this.items]; // para que Angular detecte el cambio
      this.cdr.markForCheck();
    }

    // limpia búsqueda y qty
    this.scan = '';
    this.qty = 1;
    this.filteredProducts = [];

    this.cdr.markForCheck();
  }

  // Enter en el input: si hay sugerencias, mete la primera
  public addByScan(): void {
  const p = this.selectedProduct ?? this.filteredProducts[0];
  if (!p) return;

  const qty = Number(this.qty ?? 1);
  if (!qty || qty <= 0) return;

  const existing = this.items.find(x => x.productId === p.id);
  if (existing) {
    existing.qty += qty;
  } else {
    this.items.push({
      productId: p.id,
      name: p.name,
      price: p.price,
      qty,
    });
  }

  this.items = [...this.items]; // refresca tabla
  this.scan = '';
  this.qty = 1;
  this.filteredProducts = [];
  this.selectedProduct = null;

  this.cdr.markForCheck();
}


  public removeItem(productId: string): void {
    this.items = this.items.filter((x) => x.productId !== productId);
    this.cdr.markForCheck();
  }

  public clear(): void {
    this.items = [];
    this.scan = '';
    this.qty = 1;
    this.error = null;
    this.cdr.markForCheck();
  }

  // =====================
  // Totales
  // =====================
  public subtotal(r: SaleItem): number {
    return (r.price ?? 0) * (r.qty ?? 0);
  }

  public total(): number {
    return this.items.reduce((acc, r) => acc + this.subtotal(r), 0);
  }

  public money(cents: number): string {
    const v = (cents ?? 0) / 100;
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  // =====================
  // Submit
  // =====================
  public async submit(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      const card = (this.cardNumber ?? '').trim();
      if (!card) {
        throw new Error('Card Number es obligatorio');
      }

      if (this.items.length === 0) {
        throw new Error('Agrega al menos 1 producto');
      }

      // ✅ NO MANDAR franchiseId (tu backend lo toma de req.user)
      await this.salesService.createSale({
        cardNumber: card,
        items: this.items.map((i) => ({ productId: i.productId, qty: i.qty })),
      });

      // ✅ como pediste
      await this.router.navigateByUrl('/app/sales');
    } catch (e: any) {
      // muestra mensaje decente
      this.error =
        e?.error?.message ??
        e?.message ??
        'No se pudo crear la venta';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
