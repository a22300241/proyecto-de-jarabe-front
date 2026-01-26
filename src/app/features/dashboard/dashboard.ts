import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionStore } from '../../core/state/session.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Dashboard</h1>

    <div *ngIf="user() as u; else noUser">
      <p><b>Usuario:</b> {{ u.name }} ({{ u.role }})</p>
      <p><b>Franquicia:</b> {{ u.franchiseId || 'GLOBAL' }}</p>
    </div>

    <ng-template #noUser>
      <p>No hay sesión activa.</p>
    </ng-template>
  `,
})
export class Dashboard {
  private session = inject(SessionStore);
  user = computed(() => this.session.user());
}
