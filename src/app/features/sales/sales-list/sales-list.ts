import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PermissionsService } from '../../../core/services/permissions.service';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './sales-list.html',
  styleUrls: ['./sales-list.scss'],
})
export class SalesList {
  public perm = inject(PermissionsService);

  // placeholder por si ya tienes lógica aquí
  loading = signal(false);
}
