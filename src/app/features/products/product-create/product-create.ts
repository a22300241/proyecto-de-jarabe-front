import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionStore } from '../../../core/state/session.store';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ProductsService } from '../../../core/services/products.service';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './product-create.html',
  styleUrls: ['./product-create.scss'],
})
export class ProductCreate implements OnInit {
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private cdr = inject(ChangeDetectorRef);
  private session = inject(SessionStore);

  public loading = false;
  public error: string | null = null;

  public name = '';
  public priceMXN = ''; // se captura en pesos, se convierte a centavos
  public stock: number = 1;

  ngOnInit(): void {}

  private toCents(value: string): number {
    const n = Number((value ?? '').toString().replace(',', '.'));
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
  }
  // ✅ CLAVE: para Owner/Master usar franquicia seleccionada (dropdown)
  // y para Seller / FranchiseOwner usar user.franchiseId
  private getActiveFranchiseId(): string | null {
    const s: any = this.session as any;

    const selected =
      s.selectedFranchiseId?.() ??
      s.activeFranchiseId?.() ??
      s.franchiseIdSelected?.() ??
      s.currentFranchiseId?.() ??
      s.franchiseId?.();

    if (selected) return selected as string;

    return this.session.user()?.franchiseId ?? null;
  }


  public async submit(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      const name = (this.name ?? '').trim();
      const price = this.toCents(this.priceMXN);
      const stock = Number(this.stock ?? 0);

      if (!name) throw new Error('Nombre es obligatorio');
      if (!price || price <= 0) throw new Error('Precio inválido');
      if (!Number.isFinite(stock) || stock < 0) throw new Error('Stock inválido');

     const franchiseId = this.getActiveFranchiseId();

      if (!franchiseId) {
        this.error = 'franchiseId es requerido para crear producto';
        this.cdr?.markForCheck?.();
        return;
      }

      await this.productsService.create({
        franchiseId,
        name,
        price,
        stock,
      });


      // ✅ regresar a listado
      await this.router.navigateByUrl('/app/products');
    } catch (e: any) {
      this.error = e?.error?.message ?? e?.message ?? 'No se pudo crear el producto';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  public back(): void {
    void this.router.navigateByUrl('/app/products');
  }
}
