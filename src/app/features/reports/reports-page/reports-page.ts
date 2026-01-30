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

// ✅ Datepicker
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { HttpClient } from '@angular/common/http';

import { ReportsService, SalesSummaryResponse } from '../../../core/services/reports.service';
import { SessionStore } from '../../../core/state/session.store';

type Role = 'OWNER' | 'PARTNER' | 'FRANCHISE_OWNER' | 'SELLER' | string;

type SimpleUser = {
  id: string;
  name?: string;
  nombre?: string;
  email?: string;
  correo?: string;
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
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  public loading = false;
  public error: string | null = null;

  // ===== Roles =====
  public role = computed<Role>(() => (this.session.user()?.role as Role) ?? 'SELLER');

  public canSeeReports = computed(() => {
    const r = this.role();
    return r === 'OWNER' || r === 'PARTNER' || r === 'FRANCHISE_OWNER';
  });

  // ===== Franquicia activa =====
  public getActiveFranchiseId(): string | null {
    return this.session.activeFranchiseId();
  }

  // ===== Filtros =====
  public from: Date | null = null;
  public to: Date | null = null;

  public selectedUser: SimpleUser | null = null;

  // ===== Resultados =====
  public summary: SalesSummaryResponse | null = null;

  // ===== Modal usuarios =====
  public userModalOpen = false;
  public usersLoading = false;
  public users: SimpleUser[] = [];
  public usersSearch = '';

  private autoTimer: any = null;

  constructor() {
    // Si no puede ver reportes, limpia
    effect(() => {
      if (!this.canSeeReports()) {
        this.summary = null;
        this.error = null;
        this.loading = false;
        this.userModalOpen = false;
        this.selectedUser = null;
        this.users = [];
        this.usersSearch = '';
        this.cdr.markForCheck();
        return;
      }
    });

    // ✅ AUTO inicial: al entrar y/o cambiar franquicia
    // (esto sí funciona porque activeFranchiseId es signal en tu SessionStore)
    effect(() => {
      if (!this.canSeeReports()) return;
      const franchiseId = this.getActiveFranchiseId();
      if (!franchiseId) return;

      // cuando cambia franquicia, recarga de inmediato
      this.scheduleAutoFetch(0);
    });
  }

  private markLoading(v: boolean) {
    this.loading = v;
    this.cdr.markForCheck();
  }

  // ✅ Debounce universal
  private scheduleAutoFetch(ms: number = 300) {
    clearTimeout(this.autoTimer);
    this.autoTimer = setTimeout(() => {
      void this.runSummaryAuto();
    }, ms);
  }

  // ✅ se llama desde HTML con (ngModelChange)
  public onFromChange(_: any) {
    this.scheduleAutoFetch(250);
  }

  public onToChange(_: any) {
    this.scheduleAutoFetch(250);
  }

  // ✅ Date -> ISO inicio/fin del día
  private toISOStartEnd(d: Date | null, end: boolean): string | undefined {
    if (!d) return undefined;

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const ymd = `${y}-${m}-${day}`;

    return new Date(ymd + (end ? 'T23:59:59' : 'T00:00:00')).toISOString();
  }

  // =========================
  // AUTO: SUMMARY
  // =========================
  public async runSummaryAuto(): Promise<void> {
    this.error = null;

    const franchiseId = this.getActiveFranchiseId();
    if (!franchiseId) {
      this.summary = null;
      this.error = 'Selecciona una franquicia en el selector superior.';
      this.cdr.markForCheck();
      return;
    }

    // ✅ Si puso solo una fecha, NO mandamos nada todavía (para evitar resultados raros)
    if ((this.from && !this.to) || (!this.from && this.to)) {
      this.summary = null;
      this.error = 'Selecciona ambas fechas: Desde y Hasta.';
      this.cdr.markForCheck();
      return;
    }

    try {
      this.markLoading(true);

      const fromIso = this.from ? this.toISOStartEnd(this.from, false) : undefined;
      const toIso = this.to ? this.toISOStartEnd(this.to, true) : undefined;

      this.summary = await this.reports.salesSummary({
        franchiseId,
        from: fromIso,
        to: toIso,
        sellerId: this.selectedUser?.id ?? undefined,
      });
    } catch (e: any) {
      this.summary = null;
      this.error = e?.error?.message ?? e?.message ?? 'No se pudo consultar el resumen';
    } finally {
      this.markLoading(false);
    }
  }

  // =========================
  // USUARIOS: modal tipo “productos”
  // =========================
  public async openUserModal(): Promise<void> {
    const franchiseId = this.getActiveFranchiseId();
    if (!franchiseId) {
      this.error = 'Selecciona una franquicia primero.';
      this.cdr.markForCheck();
      return;
    }

    this.userModalOpen = true;
    this.usersSearch = '';
    this.error = null;
    this.cdr.markForCheck();

    if (this.users.length > 0) return;

    await this.loadUsers(franchiseId);
  }

  public closeUserModal(): void {
    this.userModalOpen = false;
    this.cdr.markForCheck();
  }

  public async reloadUsers(): Promise<void> {
    const franchiseId = this.getActiveFranchiseId();
    if (!franchiseId) return;
    this.users = [];
    this.cdr.markForCheck();
    await this.loadUsers(franchiseId);
  }

  private async loadUsers(franchiseId: string): Promise<void> {
    try {
      this.usersLoading = true;
      this.cdr.markForCheck();

      this.users = await this.fetchUsersByFranchise(franchiseId);
    } catch (e: any) {
      this.users = [];
      this.error = e?.error?.message ?? e?.message ?? 'No se pudieron cargar usuarios';
    } finally {
      this.usersLoading = false;
      this.cdr.markForCheck();
    }
  }

  private async fetchUsersByFranchise(franchiseId: string): Promise<SimpleUser[]> {
    // ✅ IMPORTANTE: apunta al backend real
    // Si ya tienes environment.apiUrl úsalo. Si no, pon tu baseUrl del backend aquí:
    const API_BASE = (window as any).__API_BASE__ || 'http://localhost:3000';

    const token =
      // ajusta el nombre del token si tu SessionStore lo guarda diferente
      (this.session as any).accessToken?.() ||
      (this.session as any).token?.() ||
      '';

    const res: any = await this.http
      .get(`${API_BASE}/users`, {
        params: { franchiseId } as any,
        headers: token ? ({ Authorization: `Bearer ${token}` } as any) : undefined,
      })
      .toPromise();

    const list = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
    return (list as any[])
      .map((u) => ({
        id: String(u?.id ?? u?.userId ?? ''),
        name:
          u?.name ??
          u?.nombre ??
          u?.nombreCompleto ??
          u?.fullName ??
          u?.correo ??
          u?.email ??
          'Usuario',
        email: u?.email ?? u?.correo,
        role: u?.role,
      }))
      .filter((u) => !!u.id);
  }


  public pickUser(u: SimpleUser): void {
    this.selectedUser = u;
    this.userModalOpen = false;
    this.cdr.markForCheck();
    // ✅ al elegir usuario, refresca automático
    this.scheduleAutoFetch(0);
  }

  public clearUser(): void {
    this.selectedUser = null;
    this.cdr.markForCheck();
    // ✅ al quitar usuario, refresca automático
    this.scheduleAutoFetch(0);
  }

  public get filteredUsers(): SimpleUser[] {
    const q = (this.usersSearch ?? '').trim().toLowerCase();
    if (!q) return this.users;

    return this.users.filter((u) => {
      const name = (u.name ?? '').toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      const role = (u.role ?? '').toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q) || u.id.toLowerCase().includes(q);
    });
  }

  // =========================
  // UI helpers
  // =========================
  public clearFilters(): void {
    this.from = null;
    this.to = null;
    this.selectedUser = null;
    this.error = null;
    this.cdr.markForCheck();
    // ✅ vuelve al modo “sin fechas”
    this.scheduleAutoFetch(0);
  }

  public money(cents: number): string {
    const v = (cents ?? 0) / 100;
    return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  public safeText(v: any): string {
    if (v === null || v === undefined || v === '') return '—';
    return String(v);
  }
}
