import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

import { SessionStore } from '../../state/session.store';
import { PermissionsService } from '../../services/permissions.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './shell.html',
  styleUrls: ['./shell.scss'],
})
export class ShellComponent {
  public session = inject(SessionStore);
  public perm = inject(PermissionsService);
  private router = inject(Router);

  userName = computed(() => this.session.user()?.name ?? '—');
  role = computed(() => this.session.user()?.role ?? '—');

  logout() {
    this.session.logout();         // limpia tokens/user
    this.router.navigateByUrl('/login'); // ✅ te saca de /app
  }
}
