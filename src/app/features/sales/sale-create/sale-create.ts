import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';

import { SessionStore } from '../../../core/state/session.store';
import { SalesService } from '../../../core/services/sales.service';
import { ProductsService, ProductItem } from '../../../core/services/products.service';

@Component({
  selector: 'app-sale-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatTableModule,
  ],
  templateUrl: './sale-create.html',
  styleUrls: ['./sale-create.scss'],
})
export class SaleCreate {
  public session = inject(SessionStore);
  public sales = inject(SalesService);
  public products = inject(ProductsService);
  public router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  // input de búsqueda
  searchCtrl = new FormControl<string>('', { nonNullable: true });

  // sugerencias
  suggestions = signal<ProductItem[]>([]);

  // ✅ Tipado sencillo para que NO truenen los index signature errors
  form = new FormGroup({
    items: new FormArray<FormGroup<any>>([]),
  });

  displayedColumns = ['name', 'price', 'qty', 'subtotal', 'actions'];

  get itemsFA() {
    return this.form.get('items') as FormArray<FormGroup<any>>;
  }

  total = computed(() => {
    return this.itemsFA.controls.reduce((acc, g) => {
      const price = Number(g.get('price')?.value ?? 0);
      const qty = Number(g.get('qty')?.value ?? 0);
      return acc + price * qty;
    }, 0);
  });

  ngOnInit() {
    let t: any = null;
    this.searchCtrl.valueChanges?.subscribe((txt) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => this.search(txt ?? ''), 250);
    });
  }

  async search(txt: string) {
    const q = txt.trim();
    if (!q) {
      this.suggestions.set([]);
      return;
    }

    try {
      const u = this.session.user();
      const franchiseId = u?.franchiseId ?? null;

      const res = await this.products.search({ q, franchiseId });
      this.suggestions.set(res);
    } catch {
      this.suggestions.set([]);
    }
  }

  pick(p: ProductItem) {
    const fg = new FormGroup({
      productId: new FormControl(p.id, { nonNullable: true, validators: [Validators.required] }),
      name: new FormControl(p.name, { nonNullable: true, validators: [Validators.required] }),
      price: new FormControl(p.price ?? 0, { nonNullable: true, validators: [Validators.required] }),
      qty: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    });

    this.itemsFA.push(fg);

    // limpiar input
    this.searchCtrl.setValue('');
    this.suggestions.set([]);
  }

  removeAt(i: number) {
    this.itemsFA.removeAt(i);
  }

  async submit() {
    try {
      this.error.set(null);

      if (this.form.invalid) {
        this.error.set('Revisa cantidades.');
        return;
      }

      if (this.itemsFA.length === 0) {
        this.error.set('Agrega al menos un producto.');
        return;
      }

      this.loading.set(true);

      const u = this.session.user();
      const franchiseId = u?.franchiseId ?? null;

      const items = this.itemsFA.controls.map((g) => ({
        productId: String(g.get('productId')?.value),
        qty: Number(g.get('qty')?.value),
      }));

      await this.sales.createSale({ franchiseId, items });

      this.router.navigateByUrl('/app/sales');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error creando venta');
    } finally {
      this.loading.set(false);
    }
  }
}
