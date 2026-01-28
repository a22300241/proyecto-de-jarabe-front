import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { SessionStore } from '../../state/session.store';
import { AuthService } from '../../services/auth.service';
import { PermissionsService } from '../../services/permissions.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  templateUrl: './shell.html',
  styleUrls: ['./shell.scss'],
  imports: [
    // ✅ Para *ngIf / *ngFor
    CommonModule,

    // ✅ Para routerLink / router-outlet
    RouterModule,

    // ✅ Angular Material usados en tu shell.html
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
})
export class ShellComponent {
  public session = inject(SessionStore);
  public perm = inject(PermissionsService);

  private auth = inject(AuthService);
  private router = inject(Router);

  // ✅ Signals -> computed (se usan como funciones en HTML: userName(), role())
  public userName = computed(() => this.session.user()?.name ?? '');
  public role = computed(() => this.session.user()?.role ?? '');

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
