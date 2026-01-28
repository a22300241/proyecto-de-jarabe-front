import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent {
  public auth = inject(AuthService);
  private router = inject(Router);

  public loading = false;
  public error: string | null = null;

  public form = new FormGroup({
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  public async submit(): Promise<void> {
    this.error = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Completa correo y contraseña.';
      return;
    }

    const { email, password } = this.form.getRawValue();

    this.loading = true;
    try {
      await this.auth.login(email, password);
      await this.router.navigateByUrl('/app/dashboard'); // ✅ tu zona privada
    } catch (e: any) {
      // ✅ error visible (ya no “no hace nada”)
      this.error =
        e?.error?.message ||
        e?.message ||
        'No se pudo iniciar sesión. Revisa tus credenciales o el servidor.';
    } finally {
      this.loading = false;
    }
  }
}
