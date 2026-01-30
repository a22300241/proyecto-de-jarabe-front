import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // ✅ Login fuera del shell
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.LoginComponent),
  },

  // ✅ Todo lo privado dentro de /app y protegido
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/shell/shell').then((m) => m.ShellComponent),
    children: [

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./features/products/product-create/product-create')
            .then(m => m.ProductCreate),
      },

      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products-list/products-list').then(
            (m) => m.ProductsList
          ),
      },

      {
        path: 'sales',
        loadComponent: () =>
          import('./features/sales/sales-list/sales-list').then((m) => m.SalesList),
      },

      {
        path: 'sales/new',
        loadComponent: () =>
          import('./features/sales/sale-create/sale-create').then((m) => m.SaleCreate),
      },

      // ✅ REPORTES
      // 🔥 CLAVE: si tu menú apunta a /app/reports, ESTA RUTA DEBE EXISTIR
      { path: 'reports', pathMatch: 'full', redirectTo: 'reports/summary' },
      {
        path: 'reports/summary',
        loadComponent: () =>
          import('./features/reports/reports-page/reports-page')
            .then(m => m.ReportsPage),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports-page/reports-page')
            .then(m => m.ReportsPage),
      },

      {
        path: 'reports/daily-close',
        loadComponent: () =>
          import('./features/reports/daily-close/daily-close').then((m) => m.DailyClose),
      },

      // ✅ CHAT
      // 🔥 CLAVE: si tu menú apunta a /app/chat, ESTA RUTA DEBE EXISTIR
      {
        path: 'chat',
        loadComponent: () =>
          import('./features/chat/chat-page/chat-page').then((m) => m.ChatPage),
      },

      // ✅ USERS / FRANCHISES
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users-list/users-list').then((m) => m.UsersList),
      },
      {
        path: 'users/create',
        canActivate: [authGuard],
        data: { roles: ['OWNER','PARTNER','FRANCHISE_OWNER'] },
        loadComponent: () => import('./features/users/users-create/users-create').then(m => m.UsersCreate),
      },
      {
        path: 'franchises',
        loadComponent: () =>
          import('./features/franchises/franchises-list/franchises-list').then(
            (m) => m.FranchisesList
          ),
      },

      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      // ✅ IMPORTANTE: wildcard dentro del /app para NO mandar a login
      { path: '**', redirectTo: 'dashboard' },
    ],
  },

  // ✅ raíz
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'users', redirectTo: 'app/users', pathMatch: 'full' },
  { path: 'users/create', redirectTo: 'app/users/create', pathMatch: 'full' },
    // ✅ wildcard global
  { path: '**', redirectTo: 'login' },
];
