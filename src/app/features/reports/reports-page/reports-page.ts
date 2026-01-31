import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { ReportsService, SalesSummaryResponse } from '../../../core/services/reports.service';
import { SessionStore } from '../../../core/state/session.store';

// ✅ Si ya tienes UsersService en tu proyecto, puedes usarlo.
// Si no lo tienes, deja el users mock vacío y solo quita el botón de usuario.
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environments.prod';

type Role = 'OWNER' | 'PARTNER' | 'FRANCHISE_OWNER' | 'SELLER' | string;

type PickUser = {
  id: string;
  name: string;
  email?: string;
  role?: string;
};

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatProgressBarModule,

    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './reports-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage {
  private reports = inject(ReportsService);
  private session = inject(SessionStore);
  private cdr = inject(ChangeDetectorRef);

  // ✅ http directo para traer usuarios (evita depender de otro service)
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // UI
  public loading = false;
  public error: string | null = null;

  // Roles
  public role = computed<Role>(() => (this.session.user()?.role as Role) ?? 'SELLER');
  public canSeeReports = computed(() => {
    const r = this.role();
    return r === 'OWNER' || r === 'PARTNER' || r === 'FRANCHISE_OWNER';
  });

  // Franquicia activa
  public getActiveFranchiseId(): string | null {
    return this.session.activeFranchiseId();
  }

  // =========================
  // FILTROS
  // =========================
  public from: Date | null = null;
  public to: Date | null = null;

  // Daily close por día exacto
  public dayPick: Date | null = null;

  // Usuario (vendedor) opcional
  public selectedUser: PickUser | null = null;

  // =========================
  // DATA
  // =========================
  public summary: SalesSummaryResponse | null = null;
  public dailyClose: any = null;

  // Modal: usuarios
  public userModalOpen = false;
  public usersLoading = false;
  public usersError: string | null = null;
  public users: PickUser[] = [];
  public usersQuery = '';

  // Modal: topProducts
  public itemsModalDaily:
    | { title: string; items: Array<{ name: string; qty: number }> }
    | null = null;

  // debounce sencillo para auto refresh
  private rangeTimer: any = null;
  private dayTimer: any = null;

  constructor() {
    // ✅ al entrar, carga sin tocar nada
    effect(() => {
      if (!this.canSeeReports()) return;

      // si no hay franquicia aún, no truena, solo limpia
      const fid = this.getActiveFranchiseId();
      if (!fid) {
        this.summary = null;
        this.dailyClose = null;
        this.error = null;
        this.cdr.markForCheck();
        return;
      }

      // primera carga
      void this.refreshSummaryAuto();
      // daily close: si no hay día, usa hoy para que SIEMPRE se vea algo
      if (!this.dayPick) this.dayPick = new Date();
      void this.refreshDailyCloseAuto();
    });
  }

  // =========================
  // HELPERS
  // =========================
  private markLoading(v: boolean) {
    this.loading = v;
    this.cdr.markForCheck();
  }

  private toYMD(d: Date | null): string | undefined {
    if (!d) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  public money(cents: number): string {
    const v = (cents ?? 0) / 100;
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  // =========================
  // AUTO REFRESH (RANGO)
  // =========================
  public onRangeChanged() {
    if (this.rangeTimer) clearTimeout(this.rangeTimer);
    this.rangeTimer = setTimeout(() => {
      void this.refreshSummaryAuto();
    }, 300);
  }

  public onDayChanged() {
    if (this.dayTimer) clearTimeout(this.dayTimer);
    this.dayTimer = setTimeout(() => {
      void this.refreshDailyCloseAuto();
    }, 200);
  }

  // =========================
  // FETCH SUMMARY
  // =========================
  public async refreshSummaryAuto(): Promise<void> {
    this.error = null;

    const franchiseId = this.getActiveFranchiseId();
    if (!franchiseId) return;

    try {
      this.markLoading(true);

      // ✅ backend tuyo “no respeta” ISO, así que mandamos YYYY-MM-DD (como Postman)
      const from = this.toYMD(this.from);
      const to = this.toYMD(this.to);

      this.summary = await this.reports.salesSummary({
        franchiseId,
        from: from,
        to: to,
        sellerId: this.selectedUser?.id || undefined,
      });
    } catch (e: any) {
      this.summary = null;
      this.error = e?.error?.message ?? e?.message ?? 'No se pudo cargar summary';
    } finally {
      this.markLoading(false);
    }
  }

  // =========================
  // FETCH DAILY CLOSE
  // =========================
  public async refreshDailyCloseAuto(): Promise<void> {
    this.error = null;

    const franchiseId = this.getActiveFranchiseId();
    if (!franchiseId) return;

    const day = this.toYMD(this.dayPick);
    if (!day) return;

    try {
      this.markLoading(true);

      // ✅ daily-close se manda como day YYYY-MM-DD
      this.dailyClose = await this.reports.dailyClose({
        franchiseId,
        day,
        // OJO: tu backend (por tu error anterior) NO acepta sellerId aquí,
        // así que NO lo mandamos.
      });
    } catch (e: any) {
      this.dailyClose = null;
      this.error = e?.error?.message ?? e?.message ?? 'No se pudo cargar daily close';
    } finally {
      this.markLoading(false);
    }
  }

  // =========================
  // LIMPIAR
  // =========================
  public clearFilters(): void {
    this.from = null;
    this.to = null;

    this.selectedUser = null;
    this.usersQuery = '';

    this.itemsModalDaily = null;

    // mantiene el día (para que daily close siga mostrando)
    // si quieres limpiarlo también: this.dayPick = null;

    this.cdr.markForCheck();
    void this.refreshSummaryAuto();
  }

  // =========================
  // MODAL TOP PRODUCTS
  // =========================
  public openItemsModalDaily(): void {
    const arr = this.dailyClose?.topProducts ?? [];
    const items = (Array.isArray(arr) ? arr : [])
      .map((x: any) => ({
        name: String(x?.name ?? 'Producto'),
        qty: Number(x?.qty ?? 0),
      }))
      .filter((x) => x.qty > 0);

    this.itemsModalDaily = {
      title: 'Detalle de productos (topProducts)',
      items,
    };
    this.cdr.markForCheck();
  }

  public closeDailyItemsModal(): void {
    this.itemsModalDaily = null;
    this.cdr.markForCheck();
  }

  // =========================
  // MODAL USUARIOS
  // =========================
  public openUserPicker(ev?: any): void {
    // evita que algo cierre el modal por bubbling
    if (ev?.stopPropagation) ev.stopPropagation();

    this.userModalOpen = true;
    this.cdr.markForCheck();

    // carga usuarios si aún no los trae
    if (this.users.length === 0) void this.reloadUsers();
  }

  public closeUserPicker(): void {
    this.userModalOpen = false;
    this.cdr.markForCheck();
  }

  public async reloadUsers(): Promise<void> {
    const franchiseId = this.getActiveFranchiseId();
    if (!franchiseId) return;

    this.usersLoading = true;
    this.usersError = null;
    this.cdr.markForCheck();

    try {
      // ✅ IMPORTANTE:
      // antes te daba: http://localhost:4200/users?... (FRONT)
      // aquí forzamos environment.apiUrl (BACK)
      let hp = new HttpParams().set('franchiseId', franchiseId);

      // ajusta endpoint si tu backend usa otro (ej: /users/by-franchise)
      const url = `${this.apiUrl}/users`;

      const res: any = await firstValueFrom(this.http.get(url, { params: hp }));

      // res puede venir como array directo o como {items:[]}
      const list = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];

      this.users = list.map((u: any) => ({
        id: String(u?.id ?? u?.userId ?? ''),
        name: String(u?.name ?? u?.nombre ?? u?.fullName ?? u?.correo ?? 'Usuario'),
        email: u?.email ?? u?.correo ?? '',
        role: u?.role ?? u?.rol ?? '',
      })).filter((u: PickUser) => !!u.id);
    } catch (e: any) {
      this.users = [];
      this.usersError = e?.error?.message ?? e?.message ?? 'No se pudieron cargar usuarios';
    } finally {
      this.usersLoading = false;
      this.cdr.markForCheck();
    }
  }

  public get usersFiltered(): PickUser[] {
    const q = (this.usersQuery || '').trim().toLowerCase();
    if (!q) return this.users;

    return this.users.filter((u) => {
      const a = (u.name || '').toLowerCase();
      const b = (u.email || '').toLowerCase();
      const c = (u.role || '').toLowerCase();
      const d = (u.id || '').toLowerCase();
      return a.includes(q) || b.includes(q) || c.includes(q) || d.includes(q);
    });
  }

  public pickUser(u: PickUser): void {
    this.selectedUser = u;
    this.userModalOpen = false;
    this.cdr.markForCheck();

    // ✅ al elegir usuario, recarga summary
    void this.refreshSummaryAuto();
  }

  public clearSelectedUser(): void {
    this.selectedUser = null;
    this.cdr.markForCheck();
    void this.refreshSummaryAuto();
  }

  
}
