import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environments.prod';

type GlobalUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
};

@Component({
  selector: 'app-global-users-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-users.page.html',
  styleUrl: './global-users.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalUsersPage {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  public loading = false;
  public error: string | null = null;
  public users: GlobalUser[] = [];

  async ngOnInit() {
    await this.reload();
  }

  public async reload(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      const url = `${environment.apiUrl}/users/global-partners`;
      const res = await firstValueFrom(this.http.get<any>(url));
      const list = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];

      this.users = list.map((u: any) => ({
        id: String(u?.id ?? ''),
        name: String(u?.name ?? u?.email ?? 'Usuario'),
        email: String(u?.email ?? ''),
        role: String(u?.role ?? ''),
        isActive: !!u?.isActive,
      })).filter((u: GlobalUser) => !!u.id);

    } catch (e: any) {
      this.users = [];
      this.error = e?.error?.message ?? e?.message ?? 'No se pudieron cargar usuarios globales';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
