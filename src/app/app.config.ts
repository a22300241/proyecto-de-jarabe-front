import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';

import { authInterceptor } from './core/http/auth.interceptor';
import { refreshInterceptor } from './core/http/refresh.interceptor';
import { franchiseInterceptor } from './core/http/franchise.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // ✅ IMPORTANTÍSIMO:
    // 1) authInterceptor primero (pone Bearer)
    // 2) refreshInterceptor después (maneja 401 y reintenta)
    provideHttpClient(withInterceptors([authInterceptor, refreshInterceptor, franchiseInterceptor])),
  ],
};
