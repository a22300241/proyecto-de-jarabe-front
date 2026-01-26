import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';
import { ShellComponent } from './core/layout/shell/shell';

import { Dashboard } from './features/dashboard/dashboard';
import { SalesList } from './features/sales/sales-list/sales-list';
import { SaleCreate } from './features/sales/sale-create/sale-create';
import { ReportSummary } from './features/reports/report-summary/report-summary';
import { DailyClose } from './features/reports/daily-close/daily-close';

import { UsersList } from './features/users/users-list/users-list';
import { FranchisesList } from './features/franchises/franchises-list/franchises-list';
import { ChatPage } from './features/chat/chat-page/chat-page';
import { LoginComponent } from './features/auth/login/login';
import { RoleGuard } from './core/guards/role-guard';
import { ProductsList } from './features/products/products-list/products-list';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  { path: 'login', component: LoginComponent },

  {
    path: 'app',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: Dashboard },

      // Productos (todos los roles pueden ver)
      { path: 'products', component: ProductsList },

      // Ventas
      { path: 'sales', component: SalesList },
      { path: 'sales/new', component: SaleCreate }, // ✅ SELLER también entra

      // Reportes (todos pueden ver summary)
      { path: 'reports/summary', component: ReportSummary },

      // Reporte administrativo (solo OWNER/PARTNER/FRANCHISE_OWNER si quieres)
      { path: 'reports/daily-close', component: DailyClose, canActivate: [RoleGuard], data: { roles: ['OWNER', 'PARTNER', 'FRANCHISE_OWNER'] } },

      // Chat (por ahora: OWNER/PARTNER/FRANCHISE_OWNER, SELLER opcional)
      { path: 'chat', component: ChatPage, canActivate: [RoleGuard], data: { roles: ['OWNER', 'PARTNER', 'FRANCHISE_OWNER'] } },

      // Usuarios y franquicias globales solo OWNER/PARTNER
      { path: 'users', component: UsersList, canActivate: [RoleGuard], data: { roles: ['OWNER', 'PARTNER'] } },
      { path: 'franchises', component: FranchisesList, canActivate: [RoleGuard], data: { roles: ['OWNER', 'PARTNER'] } },

      // Mis vendedores (dueño de franquicia) — si lo manejas en UsersList con filtro
      { path: 'my-sellers', component: UsersList, canActivate: [RoleGuard], data: { roles: ['FRANCHISE_OWNER'] } },
    ],
  },

  { path: '**', redirectTo: 'app' },
];
