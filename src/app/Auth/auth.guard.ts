import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { PORTAL_ROUTES } from '../shared/portal-routes';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const token = localStorage.getItem('token');

    if (!token) {
      return this.loginRedirect(state.url);
    }

    if (this.isTokenExpired(token)) {
      localStorage.removeItem('token');
      return this.loginRedirect(state.url);
    }

    return true;
  }

  private loginRedirect(url: string): UrlTree {
    const loginUrl = url.startsWith('/Clientes')
      ? PORTAL_ROUTES.clientes.login
      : PORTAL_ROUTES.representantes.login;
    return this.router.parseUrl(loginUrl);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() > exp;
    } catch {
      return true;
    }
  }
}
