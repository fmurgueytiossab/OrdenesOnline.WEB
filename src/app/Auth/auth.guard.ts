import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(): boolean {
  // 🚫 En SSR: NO bloquear
  if (!isPlatformBrowser(this.platformId)) {
    return true;
  }

  // 🖥️ En browser: validar token
  const token = localStorage.getItem('token');

  if (token) {
    return true;
  }

  this.router.navigate(['/']);
  return false;
}

}
