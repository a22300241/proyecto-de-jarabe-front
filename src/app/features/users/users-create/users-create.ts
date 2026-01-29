import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { UsersService, Role, CreateUserBody } from '../../../core/services/users.service';
import { FranchisesService, FranchiseItem } from '../../../core/services/franchises.service';
import { SessionStore } from '../../../core/state/session.store';

@Component({
  selector: 'app-users-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  templateUrl: './users-create.html',
  styleUrl: './users-create.scss',
})
export class UsersCreate implements OnInit {
  private fb = inject(FormBuilder);
  private usersApi = inject(UsersService);
  private franchisesApi = inject(FranchisesService);
  private session = inject(SessionStore);
  private router = inject(Router);

  loading = false;
  error = '';

  meRole: Role = 'SELLER';
  meFranchiseId: string | null = null;

  franchises: FranchiseItem[] = [];

  // Roles permitidos si eres OWNER/PARTNER
  rolesForOwner: Role[] = ['SELLER', 'FRANCHISE_OWNER', 'PARTNER', 'OWNER'];

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    role: ['SELLER' as Role, [Validators.required]],
    franchiseId: [''], // aquí guardamos el UUID
  });

  // ✅ Solo cuando el rol necesita franquicia
  get needsFranchise(): boolean {
    const role = this.form.value.role as Role;
    return role === 'SELLER' || role === 'FRANCHISE_OWNER';
  }

  async ngOnInit() {
    const me = (this.session as any).user?.() ?? (this.session as any).user ?? null;

    this.meRole = (me?.role ?? 'SELLER') as Role;
    this.meFranchiseId = me?.franchiseId ?? null;

    // IMPORTANTE: No mover lo del FRANCHISE_OWNER (ya funciona)
    // Este componente lo usará OWNER/PARTNER principalmente, pero si entra FRANCHISE_OWNER:
    // forzamos su comportamiento SIN tocar backend.
    if (this.meRole === 'FRANCHISE_OWNER') {
      this.form.patchValue({
        role: 'SELLER',
        franchiseId: this.meFranchiseId ?? '',
      });
      this.form.get('role')?.disable();
      this.form.get('franchiseId')?.disable();
      return;
    }

    // OWNER/PARTNER: cargar franquicias para elegir
    try {
      this.loading = true;
      this.franchises = await this.franchisesApi.listAll();
    } catch (e: any) {
      this.error = this.pickErrorMessage(e);
    } finally {
      this.loading = false;
    }

    // Si cambia rol, limpiar/ajustar franquicia
    this.form.get('role')?.valueChanges.subscribe((r) => {
      const role = r as Role;

      if (role === 'OWNER' || role === 'PARTNER') {
        // Estos NO llevan franchiseId
        this.form.patchValue({ franchiseId: '' });
      }
    });
  }

  async onSubmit() {
    this.error = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    // Construcción del body CORRECTA según tu backend
    const payload: CreateUserBody = {
      email: (v.email ?? '').trim(),
      password: v.password ?? '',
      name: (v.name ?? '').trim(),
      role: v.role as Role,
    };

    // SOLO si el rol lo requiere, agregamos franchiseId (y debe ser UUID real)
    if (payload.role === 'SELLER' || payload.role === 'FRANCHISE_OWNER') {
      const fid = (v.franchiseId ?? '').trim();

      if (!fid) {
        this.error = 'Selecciona una franquicia.';
        return;
      }

      payload.franchiseId = fid;
    }

    try {
      this.loading = true;
      await this.usersApi.createUser(payload);

      // regresar a lista
      await this.router.navigateByUrl('/app/users');
    } catch (e: any) {
      this.error = this.pickErrorMessage(e);
    } finally {
      this.loading = false;
    }
  }

  onBack() {
    this.router.navigateByUrl('/app/users');
  }

  private pickErrorMessage(e: any): string {
    // HttpErrorResponse típico
    const msg = e?.error?.message ?? e?.message ?? 'Internal server error';

    // Nest a veces manda message como array
    if (Array.isArray(msg)) return msg.join(' | ');

    // Prisma unique (a veces llega como 500): si ya existe correo
    if (typeof msg === 'string' && msg.toLowerCase().includes('unique')) {
      return 'Ese correo ya existe. Usa otro.';
    }

    return String(msg);
  }
}






/* import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { UsersService } from '../../../core/services/users.service';
import { FranchisesService, FranchiseItem } from '../../../core/services/franchises.service';
import { SessionStore } from '../../../core/state/session.store';
import { Franchise } from '../../../core/services/api';

export type Role = 'OWNER' | 'PARTNER' | 'FRANCHISE_OWNER' | 'SELLER';

@Component({
  selector: 'app-users-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,

    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  templateUrl: './users-create.html',
  styleUrl: './users-create.scss',
})
export class UsersCreate implements OnInit {
  private fb = inject(FormBuilder);
  private usersApi = inject(UsersService);
  private franchisesApi = inject(FranchisesService);
  private session = inject(SessionStore);
  private router = inject(Router);

  loading = false;
  error = '';

  // Para select franquicias (OWNER/PARTNER)
  franchises: FranchiseItem[] = [];

  // Roles disponibles según el actor
  roles: Role[] = ['SELLER']; // default

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    role: ['SELLER' as Role, [Validators.required]],
    franchiseId: [''], // solo aplica para OWNER/PARTNER cuando crean SELLER/FRANCHISE_OWNER
  });

  // Helpers
  me() {
    return this.session.user(); // ✅ regla tuya
  }

  isFranchiseOwner(): boolean {
    return this.me()?.role === 'FRANCHISE_OWNER';
  }

  isAdmin(): boolean {
    const r = this.me()?.role;
    return r === 'OWNER' || r === 'PARTNER';
  }

  async ngOnInit() {
    // Configura roles según quien está logueado
    if (this.isFranchiseOwner()) {
      // FRANCHISE_OWNER solo crea SELLER
      this.roles = ['SELLER'];
      this.form.patchValue({ role: 'SELLER' });
      this.form.controls.role.disable(); // fijo
      this.form.controls.franchiseId.disable(); // no se usa
      return;
    }

    // OWNER/PARTNER pueden crear todo
    if (this.isAdmin()) {
      this.roles = ['OWNER', 'PARTNER', 'FRANCHISE_OWNER', 'SELLER'];
      // Carga franquicias para cuando el rol requiera franchiseId
      await this.loadFranchisesSafe();
      return;
    }

    // Si por alguna razón entra otro rol (SELLER)
    this.roles = ['SELLER'];
    this.form.patchValue({ role: 'SELLER' });
    this.form.controls.role.disable();
    this.form.controls.franchiseId.disable();
  }

  async loadFranchisesSafe() {
    try {
      this.franchises = await firstValueFrom(this.franchisesApi.list());
    } catch (e) {
      // no es crítico, pero lo anotamos
      console.warn('No pude cargar franquicias', e);
      this.franchises = [];
    }
  }

  private buildPayload() {
    const v = this.form.getRawValue(); // incluye disabled
    const me = this.me();

    const role = v.role as Role;

    const payload: any = {
      email: (v.email ?? '').trim(),
      password: v.password,
      name: (v.name ?? '').trim(),
      role,
    };

    // ✅ FRANCHISE_OWNER: siempre crea SELLER en su franquicia
    if (me?.role === 'FRANCHISE_OWNER') {
      payload.role = 'SELLER';
      payload.franchiseId = me.franchiseId; // debe venir del JWT/session
      return payload;
    }

    // ✅ OWNER/PARTNER:
    // - Si crea OWNER/PARTNER => NO debe mandar franchiseId
    // - Si crea FRANCHISE_OWNER/SELLER => debe mandar franchiseId válido
    if (role === 'OWNER' || role === 'PARTNER') {
      return payload; // sin franchiseId
    }

    const fid = (v.franchiseId ?? '').trim();
    // IMPORTANTE: no mandar '' o null, solo si hay valor real
    if (fid) payload.franchiseId = fid;

    return payload;
  }

  // Se usa para mostrar/ocultar selector de franquicia
  needsFranchiseSelect(): boolean {
    if (!this.isAdmin()) return false;

    const role = (this.form.get('role')?.value ?? 'SELLER') as Role;
    // FRANCHISE_OWNER y SELLER requieren franchiseId según tu backend
    return role === 'FRANCHISE_OWNER' || role === 'SELLER';
  }

  async onCreate() {
    this.error = '';
    if (this.form.invalid) return;

    const payload = this.buildPayload();

    try {
      this.loading = true;

      await firstValueFrom(this.usersApi.createUser(payload));

      // éxito => regresa a lista
      await this.router.navigateByUrl('/app/users');
    } catch (e: any) {
      // ✅ mostrar el error real del backend
      const msg =
        e?.error?.message?.toString?.() ||
        (Array.isArray(e?.error?.message) ? e.error.message.join(', ') : '') ||
        e?.message ||
        'Error al crear usuario';

      this.error = msg || 'Error al crear usuario';
      console.error('CREATE USER ERROR:', e);
    } finally {
      this.loading = false;
    }
  }

  onCancel() {
    this.router.navigateByUrl('/app/users');
  }
}
 */
