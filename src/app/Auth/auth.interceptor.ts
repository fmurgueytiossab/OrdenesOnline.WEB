import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { PORTAL_ROUTES } from '../shared/portal-routes';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const router = inject(Router);

  const authReq = token
    ? req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      })
    : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err.status === 401) {
        localStorage.removeItem('token');
        const loginUrl = router.url.startsWith('/Clientes')
          ? PORTAL_ROUTES.clientes.login
          : PORTAL_ROUTES.representantes.login;
        router.navigateByUrl(loginUrl);
      }
      return throwError(() => err);
    })
  );
};
