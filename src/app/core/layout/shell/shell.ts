import { ChangeDetectionStrategy,effect,ChangeDetectorRef, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { SessionStore } from '../../state/session.store'; // ✅ AJUSTA si tu ruta cambia
import { PermissionsService } from '../../services/permissions.service'; // ✅ AJUSTA si tu ruta cambia
import { FranchisesService } from '../../services/franchises.service'; // ✅ AJUSTA si tu ruta cambia
import { environment } from '../../../../environments/environments';
import { firstValueFrom } from 'rxjs';

type FranchiseItem = { id: string; name?: string | null };

@Component({
  selector: 'app-shell',
  standalone: true,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
})
export class ShellComponent {
  private router = inject(Router);
  private session = inject(SessionStore);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);


  // ✅ lo pide el HTML (perm.can('...'))
  public perm = inject(PermissionsService);

  // ✅ selector de franquicias (solo OWNER/PARTNER)
  private franchisesApi = inject(FranchisesService);
  public franchises: FranchiseItem[] = [];

  // ✅ lo pide el HTML
  public userName = computed(() => this.session.user()?.name ?? '');
  public role = computed(() => this.session.user()?.role ?? '');
  public activeFranchiseId = computed(() => this.session.activeFranchiseId() ?? null);

  constructor() {
    // carga franquicias cuando sea necesario
    void this.loadFranchisesIfNeeded();
    effect(() => {
      // dispara cuando cambie el usuario logueado
      const user = this.session.user();

      // si no hay usuario, limpia
      if (!user) {
        this.globalPartners = [];
        this.cdr.markForCheck();
        return;
      }

      // si es super, carga una vez
      if (this.isSuper()) {
        void this.loadGlobalPartners();
      } else {
        this.globalPartners = [];
        this.cdr.markForCheck();
      }
    });
  }

  // ✅ lo pide el HTML
  public go(path: string) {
    this.router.navigateByUrl(path);
  }

  // ✅ lo pide el HTML
  public logout() {
    this.session.clear(); // o this.session.logout() si así lo tienes
    this.router.navigateByUrl('/login');
  }

  // ✅ lo pide el HTML
  public isOwnerPartner(): boolean {
    const r = this.session.user()?.role ?? null;
    return r === 'OWNER' || r === 'PARTNER';
  }
  public globalPartners: Array<{ id: string; name: string; email?: string; role?: string }> = [];
  public globalPartnersLoading = false;
  public globalPartnersError: string | null = null;

  public isSuper = computed(() => {
    const r = this.session.user()?.role;
    return r === 'OWNER' || r === 'PARTNER';
  });





  public async loadGlobalPartners(): Promise<void> {
    if (!this.isSuper()) {
      this.globalPartners = [];
      return;
    }

    this.globalPartnersLoading = true;
    this.globalPartnersError = null;

    try {
      const url = `${environment.apiUrl}/users/global-partners`;
      const res = await firstValueFrom(this.http.get<any[]>(url));

      this.globalPartners = (Array.isArray(res) ? res : []).map(u => ({
        id: String(u?.id ?? ''),
        name: String(u?.name ?? u?.email ?? 'Usuario'),
        email: u?.email ?? '',
        role: u?.role ?? '',
      })).filter(u => !!u.id);

    } catch (e: any) {
      this.globalPartners = [];
      this.globalPartnersError = e?.error?.message ?? e?.message ?? 'No se pudieron cargar socios globales';
    } finally {
      this.globalPartnersLoading = false;
      this.cdr.markForCheck();
    }
  }







  // ✅ lo pide el HTML (label en el selector)
  public franchiseLabel(f: FranchiseItem) {
    return f?.name ? f.name : f.id;
  }

  // ✅ lo pide el HTML (selectionChange)
  public onFranchiseChange(franchiseId: string) {
    this.session.setActiveFranchiseId(franchiseId);
  }

  private async loadFranchisesIfNeeded(): Promise<void> {
    // solo OWNER/PARTNER usan selector
    if (!this.isOwnerPartner()) return;

    try {
      // ✅ aquí NO uses usersApi. Es franchisesApi.
      // Cambia el nombre del método según tu servicio:
      // - listAll()
      // - list()
      // - getAll()
      // - getFranchises()
      const res = await this.franchisesApi.listAll(); // 👈 si tu servicio NO se llama así, dime cómo se llama
      this.franchises = Array.isArray(res) ? res : [];
      if (!this.session.activeFranchiseId() && this.franchises.length > 0) {
        this.session.setActiveFranchiseId(this.franchises[0].id);
      }
    } catch {
      this.franchises = [];
    }
  }
}
