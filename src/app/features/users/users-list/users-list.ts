import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

import { firstValueFrom } from 'rxjs';
import { UsersService, UserDto } from '../../../core/services/users.service';
import { SessionStore } from '../../../core/state/session.store';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss',
})
export class UsersList implements OnInit {
  private usersApi = inject(UsersService);
  private session = inject(SessionStore);
  private cdr = inject(ChangeDetectorRef);

  public loading = false;
  public error: string | null = null;

  public users: UserDto[] = [];

  public displayedColumns = ['name', 'email', 'role', 'status', 'actions'];

  async ngOnInit(): Promise<void> {
    await this.load(); // ✅ IMPORTANTÍSIMO para que al entrar siempre consulte backend
  }

  public async onReload(): Promise<void> {
    await this.load();
  }

  private getFranchiseIdForQuery(): string | undefined {
    const u = this.session.user();
    if (!u) return undefined;

    // FRANCHISE_OWNER/SELLER => su franquicia
    if (u.role === 'FRANCHISE_OWNER' || u.role === 'SELLER') {
      return u.franchiseId ?? undefined;
    }

    // OWNER/PARTNER => si tienes selector
    return this.session.activeFranchiseId() ?? undefined;
  }

  public async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      const franchiseId = this.getFranchiseIdForQuery();
      const res = await firstValueFrom(this.usersApi.list(franchiseId));
      this.users = Array.isArray(res) ? res : [];
    } catch (e: any) {
      this.users = [];
      this.error = e?.error?.message ?? e?.message ?? 'No se pudieron cargar los usuarios';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  public statusLabel(u: UserDto): string {
    return u.isActive ? 'ACTIVO' : 'INACTIVO';
  }

  public actionLabel(u: UserDto): string {
    return u.isActive ? 'Desactivar' : 'Activar';
  }

  public async toggleActive(u: UserDto): Promise<void> {
    // ✅ NO permitir desactivarte tú mismo (extra seguro)
    const me = this.session.user();
    if (me?.userId && u.id === me.userId) return;

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      const res = u.isActive
        ? await firstValueFrom(this.usersApi.deactivate(u.id))
        : await firstValueFrom(this.usersApi.activate(u.id));

      // ✅ Actualiza SOLO ese usuario en la lista para que cambie el botón
      const idx = this.users.findIndex(x => x.id === u.id);
      if (idx >= 0) {
        this.users[idx] = { ...this.users[idx], isActive: !!res.isActive };
        this.users = [...this.users]; // fuerza refresco tabla
      }
    } catch (e: any) {
      this.error = e?.error?.message ?? e?.message ?? 'No se pudo cambiar el estado';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
