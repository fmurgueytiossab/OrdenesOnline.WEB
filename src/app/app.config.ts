import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';  

import { routes } from './app.routes';
import { authInterceptor } from './Auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: APP_BASE_HREF, useValue: '/Representantes/' }  // <- base-href correcto
  ]
};