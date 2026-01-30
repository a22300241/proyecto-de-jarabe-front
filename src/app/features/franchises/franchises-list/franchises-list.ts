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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { FranchisesService, FranchiseItem } from '../../../core/services/franchises.service';
import { SessionStore } from '../../../core/state/session.store';

@Component({
  selector: 'app-franchises-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatDialogModule,
  ],
  templateUrl: './franchises-list.html',
  styleUrl: './franchises-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FranchisesList {
  private franchisesService = inject(FranchisesService);
  private session = inject(SessionStore);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  public loading = false;
  public error: string | null = null;
  public franchises: FranchiseItem[] = [];

  public displayedColumns: string[] = [
    'name',
    'isActive',
    'createdAt',
    'actions',
  ];

  constructor() {
    // mismo estilo: cuando existe usuario => carga lista
    effect(() => {
      const u = this.session.user();
      if (!u) {
        this.franchises = [];
        this.error = null;
        this.loading = false;
        this.cdr.markForCheck();
        return;
      }
      void this.load();
    });
  }

  public yesNo(v: boolean): string {
    return v ? 'Activo' : 'Inactivo';
  }

  public fmtDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString('es-MX');
  }

  public async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      const list = await this.franchisesService.list();
      this.franchises = Array.isArray(list) ? list : [];
    } catch (e: any) {
      this.franchises = [];
      this.error = e?.error?.message ?? e?.message ?? 'No se pudieron cargar franquicias';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  public onReload(): void {
    void this.load();
  }

  // ✅ VER (GET /franchises/:id)
  public openView(f: FranchiseItem): void {
    this.error = null;
    this.cdr.markForCheck();

    const ref = this.dialog.open(FranchiseViewDialog, {
      width: '420px',
      data: { id: f.id },
    });

    ref.afterClosed().subscribe(() => {
      // ✅ evita “flash” / mensajito raro al cerrar
      this.error = null;
      this.cdr.markForCheck();
    });
  }

  // ✅ CREAR (POST /franchises)
  public openCreate(): void {
    this.error = null;

    const ref = this.dialog.open(FranchiseCreateDialog, {
      width: '420px',
    });

    ref.afterClosed().subscribe(async (result) => {
      if (!result) return;

      try {
        this.loading = true;
        this.error = null;
        this.cdr.markForCheck();

        await this.franchisesService.create({ name: result.name });

        await this.load();
      } catch (e: any) {
        this.error = e?.error?.message ?? 'No se pudo crear la franquicia';
      } finally {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}

/* =========================================================
   DIALOGS
========================================================= */

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Inject } from '@angular/core';

// ✅ Crear franquicia
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Nueva franquicia</h2>

    <div mat-dialog-content class="dlg">
      <mat-form-field appearance="outline" class="field">
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="name" placeholder="Ej: Franquicia 3" />
      </mat-form-field>
      <div class="hint">Se creará con estado Activo por defecto (según backend).</div>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(null)">Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()">Crear</button>
    </div>
  `,
  styles: [`
    .dlg { display:flex; flex-direction:column; gap:12px; padding-top:8px; }
    .field { width:100%; }
    .hint { opacity:.8; font-size: 12px; }
  `]
})
class FranchiseCreateDialog {
  public name = '';

  constructor(public ref: MatDialogRef<FranchiseCreateDialog>) {}

  save(): void {
    const n = (this.name ?? '').trim();
    if (!n) return;
    this.ref.close({ name: n });
  }
}

// ✅ Ver franquicia por ID (GET /franchises/:id)
@Component({
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressBarModule],
  template: `
    <h2 mat-dialog-title>Detalle de franquicia</h2>

    <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>

    <div mat-dialog-content class="dlg">
      <div *ngIf="error" class="err">{{ error }}</div>

      <ng-container *ngIf="item">
        <div class="row"><span class="k">ID</span><span class="v mono">{{ item.id }}</span></div>
        <div class="row"><span class="k">Nombre</span><span class="v">{{ item.name }}</span></div>
        <div class="row"><span class="k">Estado</span><span class="v">{{ item.isActive ? 'Activo' : 'Inactivo' }}</span></div>
        <div class="row"><span class="k">Creado</span><span class="v">{{ fmtDate(item.createdAt) }}</span></div>
      </ng-container>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cerrar</button>
    </div>
  `,
  styles: [`
    .dlg { display:flex; flex-direction:column; gap:10px; padding-top:8px; }
    .row { display:flex; gap:12px; }
    .k { width:90px; opacity:.75; }
    .v { flex:1; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; }
    .err { background: #ffd9d9; border: 1px solid rgba(0,0,0,.08); padding: 8px 10px; border-radius: 10px; }
  `]
})
class FranchiseViewDialog {
  private franchisesService = inject(FranchisesService);
  private cdr = inject(ChangeDetectorRef); // ✅ CLAVE para OnPush

  public loading = false;
  public error: string | null = null;
  public item: FranchiseItem | null = null;

  constructor(
    public ref: MatDialogRef<FranchiseViewDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string }
  ) {
    void this.load();
  }

  fmtDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString('es-MX');
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.item = null;
    this.cdr.markForCheck(); // ✅ pinta el progress inmediatamente

    try {
      this.item = await this.franchisesService.getById(this.data.id);
    } catch (e: any) {
      this.item = null;
      this.error = e?.error?.message ?? e?.message ?? 'No se pudo cargar la franquicia';
    } finally {
      this.loading = false;
      this.cdr.markForCheck(); // ✅ apaga progress y pinta item/error
    }
  }
}
