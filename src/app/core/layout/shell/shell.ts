import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { SessionStore, SessionTokens, SessionUser } from '../../state/session.store';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';
import { FranchisesService, FranchiseItem } from '../../services/franchises.service';

@Component({
  selector: 'app-shell',
  standalone: true,
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
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class ShellComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private session = inject(SessionStore);
  public perm = inject(PermissionsService);
  private franchisesService = inject(FranchisesService);

  // 👇 usado por tu HTML: *ngFor="let f of franchises"
  public franchises: FranchiseItem[] = [];

  // 👇 usado por tu HTML: {{ userName() }} / {{ role() }}
  public userName = computed(() => this.session.user()?.name ?? '—');
  public role = computed(() => this.session.user()?.role ?? '—');

  async ngOnInit(): Promise<void> {
    // Si es OWNER/PARTNER, cargamos franquicias para el selector
    if (this.isOwnerPartner()) {
      await this.loadFranchises();

      // Si no hay franquicia activa, ponemos la primera disponible
      const current = this.activeFranchiseId();
      if (!current && this.franchises.length > 0) {
        this.onFranchiseChange(this.franchises[0].id);
      }
    }
  }

  // ✅ Tu HTML lo usa: *ngIf="isOwnerPartner()"
  public isOwnerPartner(): boolean {
    return this.perm.isAny('OWNER', 'PARTNER');
  }

  // ✅ Tu HTML lo usa: [value]="activeFranchiseId()"
  public activeFranchiseId(): string | null {
    return this.session.user()?.franchiseId ?? null;
  }

  // ✅ Tu HTML lo usa: {{ franchiseLabel(f) }}
  public franchiseLabel(f: FranchiseItem): string {
    return f.name ?? f.id;
  }

  public async loadFranchises(): Promise<void> {
    try {
      this.franchises = await firstValueFrom(this.franchisesService.listAll());
    } catch {
      this.franchises = [];
    }
  }

  // ✅ Tu HTML lo usa: (selectionChange)="onFranchiseChange($event.value)"
  public onFranchiseChange(franchiseId: string): void {
    const user = this.session.user();
    const tokens = this.session.tokens();

    if (!user || !tokens) return;

    // Importante: NO cambiar tokens, solo actualizar franchiseId
    const nextUser: SessionUser = {
      ...user,
      franchiseId,
    };

    const nextTokens: SessionTokens = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };

    this.session.setSession(nextUser, nextTokens);
  }

  public logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
