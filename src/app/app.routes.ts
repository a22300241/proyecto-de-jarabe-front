import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.LoginComponent),
  },

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

      // ✅ FRANQUICIAS (ruta que tu menú usa)
      {
        path: 'franchises',
        loadComponent: () =>
          import('./features/franchises/franchises-list/franchises-list').then(
            (m) => m.FranchisesList
          ),
      },

      // ✅ REPORTES
      {
        path: 'reports',
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./features/reports/report-summary/report-summary').then(
                (m) => m.ReportSummary
              ),
          },
          {
            path: 'daily-close',
            loadComponent: () =>
              import('./features/reports/daily-close/daily-close').then(
                (m) => m.DailyClose
              ),
          },
        ],
      },

      // ✅ USUARIOS
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users-list/users-list').then((m) => m.UsersList),
      },

      {
        path: 'chat',
        loadComponent: () =>
          import('./features/chat/chat-page/chat-page').then((m) => m.ChatPage),
      },

      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
